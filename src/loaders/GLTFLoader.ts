import { Node } from '../core/Node';
import { Mesh } from '../objects/Mesh';
import { BufferGeometry } from '../geometry/BufferGeometry';
import { StandardMaterial } from '../materials/StandardMaterial';

export type LoadedModel = { scene: Node; animations: unknown[] };
type Accessor = { values: number[]; components: number };

export class GLTFLoader {
  async load(url: string): Promise<LoadedModel> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load glTF: ${response.status} ${response.statusText}`);
    const base = new URL('.', url);
    return url.toLowerCase().endsWith('.glb') ? this.parseGlb(await response.arrayBuffer(), base) : this.parseJson(await response.json(), base);
  }

  async parseGlb(data: ArrayBuffer, base = new URL('.', globalThis.location?.href ?? 'http://localhost/')): Promise<LoadedModel> {
    const view = new DataView(data);
    if (data.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB header');
    const jsonLength = view.getUint32(12, true);
    if (view.getUint32(16, true) !== 0x4e4f534a) throw new Error('GLB JSON chunk is missing');
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength)).replace(/\0+$/g, '').trim());
    const binHeader = 20 + jsonLength;
    const binLength = binHeader + 8 <= data.byteLength ? view.getUint32(binHeader, true) : 0;
    const binType = binHeader + 8 <= data.byteLength ? view.getUint32(binHeader + 4, true) : 0;
    return this.build(json, binType === 0x004e4942 ? [data.slice(binHeader + 8, binHeader + 8 + binLength)] : [], base);
  }

  async parseJson(json: any, base: URL): Promise<LoadedModel> {
    const buffers = await Promise.all((json.buffers ?? []).map(async (buffer: any) => {
      if (buffer.uri?.startsWith('data:')) return this.decodeDataUri(buffer.uri);
      const response = await fetch(new URL(buffer.uri, base));
      if (!response.ok) throw new Error(`Unable to load glTF buffer: ${response.status}`);
      return response.arrayBuffer();
    }));
    return this.build(json, buffers, base);
  }

  private decodeDataUri(uri: string) {
    const raw = atob(uri.split(',')[1]);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return bytes.buffer;
  }

  private build(json: any, buffers: ArrayBuffer[], _base: URL): LoadedModel {
    const root = new Node();
    const read = (index: number): Accessor => {
      const accessor = json.accessors?.[index];
      const view = accessor ? json.bufferViews?.[accessor.bufferView] : undefined;
      const buffer = view ? buffers[view.buffer ?? 0] : undefined;
      if (!accessor || !view || !buffer) throw new Error(`Invalid glTF accessor ${index}`);
      const components = accessor.type === 'VEC4' ? 4 : accessor.type === 'VEC3' ? 3 : accessor.type === 'VEC2' ? 2 : 1;
      const componentBytes = accessor.componentType === 5126 || accessor.componentType === 5125 ? 4 : accessor.componentType === 5123 ? 2 : 1;
      const stride = view.byteStride ?? components * componentBytes;
      const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
      const dataView = new DataView(buffer);
      const values: number[] = [];
      const readComponent = (offset: number) => accessor.componentType === 5126 ? dataView.getFloat32(offset, true) : accessor.componentType === 5125 ? dataView.getUint32(offset, true) : accessor.componentType === 5123 ? dataView.getUint16(offset, true) : dataView.getUint8(offset);
      for (let item = 0; item < accessor.count; item += 1) for (let component = 0; component < components; component += 1) values.push(readComponent(start + item * stride + component * componentBytes));
      return { values, components };
    };
    const expand = (source: number[] | undefined, indices: number[], stride: number) => source ? indices.flatMap((index) => source.slice(index * stride, index * stride + stride)) : undefined;
    const meshList = (json.meshes ?? []).map((mesh: any) => {
      const primitive = mesh.primitives?.[0];
      if (!primitive?.attributes?.POSITION) return null;
      const position = read(primitive.attributes.POSITION);
      let positions = position.values;
      let normals = primitive.attributes.NORMAL === undefined ? undefined : read(primitive.attributes.NORMAL).values;
      let uvs = primitive.attributes.TEXCOORD_0 === undefined ? undefined : read(primitive.attributes.TEXCOORD_0).values;
      if (primitive.indices !== undefined) {
        const indices = read(primitive.indices).values;
        positions = expand(positions, indices, 3) ?? [];
        normals = expand(normals, indices, 3);
        uvs = expand(uvs, indices, 2);
      }
      const pbr = json.materials?.[primitive.material]?.pbrMetallicRoughness;
      const color = pbr?.baseColorFactor ? `#${pbr.baseColorFactor.slice(0, 3).map((value: number) => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}` : '#b5b1c6';
      return new Mesh(new BufferGeometry(positions, normals, uvs), new StandardMaterial({ color, roughness: pbr?.roughnessFactor ?? 0.5, metalness: pbr?.metallicFactor ?? 0 }));
    });
    const visited = new Set<number>();
    const visit = (index: number, parent: Node) => {
      if (visited.has(index)) return;
      visited.add(index);
      const node = json.nodes?.[index];
      if (!node) return;
      const mesh = meshList[node.mesh];
      const target = mesh ?? parent;
      if (mesh) { if (node.translation) mesh.position.set(...node.translation); if (node.scale) mesh.scale.set(...node.scale); parent.add(mesh); }
      for (const child of node.children ?? []) visit(child, target);
    };
    for (const index of json.scenes?.[json.scene ?? 0]?.nodes ?? []) visit(index, root);
    if (root.children.length === 0) for (let index = 0; index < (json.nodes ?? []).length; index += 1) if (json.nodes[index].mesh !== undefined) visit(index, root);
    if (root.children.length === 0) throw new Error('glTF scene contains no renderable meshes');
    let radius = 0;
    root.traverse((node) => { if (node instanceof Mesh) radius = Math.max(radius, node.geometry.boundingRadius); });
    if (radius > 4) root.scale.set(3 / radius, 3 / radius, 3 / radius);
    return { scene: root, animations: json.animations ?? [] };
  }
}
