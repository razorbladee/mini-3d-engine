import { Node } from '../core/Node';
import { Mesh } from '../objects/Mesh';
import { BufferGeometry } from '../geometry/BufferGeometry';
import { StandardMaterial } from '../materials/StandardMaterial';

export type LoadedModel = { scene: Node; animations: unknown[]; bounds: { center: [number, number, number]; radius: number } };
type Accessor = { values: number[]; count: number; size: number };

export class GLTFLoader {
  async load(url: string): Promise<LoadedModel> {
    let response = await fetch(url);
    if (!response.ok && url.includes('/glTF-Binary/')) {
      url = url.replace('/glTF-Binary/', '/glTF/').replace(/\.glb$/i, '.gltf');
      response = await fetch(url);
    }
    if (!response.ok) throw new Error(`Unable to load glTF: ${response.status} ${response.statusText}`);
    const base = new URL('.', url);
    return url.toLowerCase().endsWith('.glb') ? this.parseGlb(await response.arrayBuffer(), base) : this.parseJson(await response.json(), base);
  }

  async parseGlb(data: ArrayBuffer, base = new URL('.', globalThis.location?.href ?? 'http://localhost/')): Promise<LoadedModel> {
    const view = new DataView(data);
    if (data.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB header');
    const jsonLength = view.getUint32(12, true);
    if (view.getUint32(16, true) !== 0x4e4f534a) throw new Error('GLB JSON chunk is missing');
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, jsonLength)).replace(/\0+$/, '').trim());
    const binOffset = 20 + jsonLength;
    const binLength = binOffset + 8 <= data.byteLength ? view.getUint32(binOffset, true) : 0;
    const binType = binOffset + 8 <= data.byteLength ? view.getUint32(binOffset + 4, true) : 0;
    return this.build(json, binType === 0x004e4942 ? [data.slice(binOffset + 8, binOffset + 8 + binLength)] : [], base);
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

  private decodeDataUri(uri: string) { const raw = atob(uri.split(',')[1]); const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i); return bytes.buffer; }

  private readAccessor(json: any, buffers: ArrayBuffer[], index: number): Accessor {
    const accessor = json.accessors?.[index];
    const view = json.bufferViews?.[accessor?.bufferView];
    const buffer = buffers[view?.buffer ?? 0];
    if (!accessor || !view || !buffer) throw new Error(`Invalid glTF accessor ${index}`);
    const size = accessor.type === 'SCALAR' ? 1 : accessor.type === 'VEC2' ? 2 : accessor.type === 'VEC3' ? 3 : accessor.type === 'VEC4' ? 4 : 0;
    if (!size) throw new Error(`Unsupported glTF accessor type ${accessor.type}`);
    const bytes = accessor.componentType === 5121 ? 1 : accessor.componentType === 5123 ? 2 : 4;
    const stride = view.byteStride ?? size * bytes;
    const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const data = new DataView(buffer);
    const values: number[] = [];
    const read = (offset: number) => accessor.componentType === 5126 ? data.getFloat32(offset, true) : accessor.componentType === 5125 ? data.getUint32(offset, true) : accessor.componentType === 5123 ? data.getUint16(offset, true) : data.getUint8(offset);
    for (let item = 0; item < accessor.count; item += 1) for (let component = 0; component < size; component += 1) values.push(read(start + item * stride + component * bytes));
    return { values, count: accessor.count, size };
  }

  private build(json: any, buffers: ArrayBuffer[], _base: URL): LoadedModel {
    const root = new Node();
    const meshes = (json.meshes ?? []).map((mesh: any) => {
      const primitive = mesh.primitives?.[0];
      if (!primitive?.attributes?.POSITION) return null;
      const position = this.readAccessor(json, buffers, primitive.attributes.POSITION).values;
      let positions = position;
      let normals = primitive.attributes.NORMAL === undefined ? undefined : this.readAccessor(json, buffers, primitive.attributes.NORMAL).values;
      let uvs = primitive.attributes.TEXCOORD_0 === undefined ? undefined : this.readAccessor(json, buffers, primitive.attributes.TEXCOORD_0).values;
      if (primitive.indices !== undefined) {
        const indices = this.readAccessor(json, buffers, primitive.indices).values;
        const expand = (source: number[] | undefined, stride: number) => source ? indices.flatMap((index) => source.slice(index * stride, index * stride + stride)) : undefined;
        positions = expand(position, 3) ?? [];
        normals = expand(normals, 3);
        uvs = expand(uvs, 2);
      }
      const pbr = json.materials?.[primitive.material]?.pbrMetallicRoughness;
      return new Mesh(new BufferGeometry(positions, normals, uvs), new StandardMaterial({ color: '#b5b1c6', roughness: pbr?.roughnessFactor ?? .5, metalness: pbr?.metallicFactor ?? 0 }));
    });
    const apply = (node: any, target: Node) => {
      if (node.translation) target.position.set(...node.translation);
      if (node.scale) target.scale.set(...node.scale);
      if (node.rotation) { const [x, y, z, w] = node.rotation; const sinr = 2 * (w * x + y * z), cosr = 1 - 2 * (x * x + y * y), sinp = 2 * (w * y - z * x), siny = 2 * (w * z + x * y), cosy = 1 - 2 * (y * y + z * z); target.rotation.set(Math.atan2(sinr, cosr), Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp), Math.atan2(siny, cosy)); }
    };
    const visit = (index: number, parent: Node) => { const node = json.nodes?.[index]; if (!node) return; const container = new Node(); apply(node, container); const mesh = meshes[node.mesh]; if (mesh) { apply(node, mesh); parent.add(mesh); } else parent.add(container); for (const child of node.children ?? []) visit(child, mesh ?? container); };
    for (const index of json.scenes?.[json.scene ?? 0]?.nodes ?? []) visit(index, root);
    if (root.children.length === 0) throw new Error('glTF scene contains no renderable meshes');
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    root.traverse((node) => { if (node instanceof Mesh) for (let i = 0; i < node.geometry.positions.length; i += 3) { min[0] = Math.min(min[0], node.geometry.positions[i]); min[1] = Math.min(min[1], node.geometry.positions[i + 1]); min[2] = Math.min(min[2], node.geometry.positions[i + 2]); max[0] = Math.max(max[0], node.geometry.positions[i]); max[1] = Math.max(max[1], node.geometry.positions[i + 1]); max[2] = Math.max(max[2], node.geometry.positions[i + 2]); } });
    const center: [number, number, number] = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const radius = Math.max(Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2, .0001);
    root.position.set(-center[0], -center[1], -center[2]);
    if (radius > 3) root.scale.set(3 / radius, 3 / radius, 3 / radius);
    return { scene: root, animations: json.animations ?? [], bounds: { center, radius } };
  }
}
