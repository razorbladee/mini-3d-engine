import { Node } from '../core/Node';
import { Mesh } from '../objects/Mesh';
import { BufferGeometry } from '../geometry/BufferGeometry';
import { StandardMaterial } from '../materials/StandardMaterial';
export type LoadedModel = {
  scene: Node;
  animations: unknown[];
  bounds: { center: [number, number, number]; radius: number };
};
type Accessor = { values: number[]; count: number; size: number };
function readTriple(value: unknown, field: string): [number, number, number] {
  if (!Array.isArray(value) || value.length < 3)
    throw new Error(`glTF node ${field} must be an array of three numbers`);
  const [x, y, z] = value;
  if (![x, y, z].every((n) => typeof n === 'number' && Number.isFinite(n)))
    throw new Error(`glTF node ${field} must contain finite numbers`);
  return [x, y, z];
}
export class GLTFLoader {
  async load(url: string): Promise<LoadedModel> {
    let r = await fetch(url);
    if (!r.ok && url.includes('/glTF-Binary/')) {
      url = url.replace('/glTF-Binary/', '/glTF/').replace(/\.glb$/i, '.gltf');
      r = await fetch(url);
    }
    if (!r.ok) throw new Error(`Unable to load glTF: ${r.status} ${r.statusText}`);
    const base = new URL('.', url);
    return url.toLowerCase().endsWith('.glb')
      ? this.parseGlb(await r.arrayBuffer(), base)
      : this.parseJson(await r.json(), base);
  }
  async parseGlb(
    data: ArrayBuffer,
    base = new URL('.', globalThis.location?.href ?? 'http://localhost/'),
  ): Promise<LoadedModel> {
    const v = new DataView(data);
    if (data.byteLength < 20 || v.getUint32(0, true) !== 0x46546c67) throw new Error('Invalid GLB header');
    const len = v.getUint32(12, true);
    if (v.getUint32(16, true) !== 0x4e4f534a) throw new Error('GLB JSON chunk is missing');
    const json = JSON.parse(
      new TextDecoder()
        .decode(new Uint8Array(data, 20, len))
        .replace(/\0+$/, '')
        .trim(),
    );
    const bin = 20 + len;
    const binLen = bin + 8 <= data.byteLength ? v.getUint32(bin, true) : 0;
    const binType = bin + 8 <= data.byteLength ? v.getUint32(bin + 4, true) : 0;
    return this.build(json, binType === 0x004e4942 ? [data.slice(bin + 8, bin + 8 + binLen)] : [], base);
  }
  async parseJson(json: any, base: URL): Promise<LoadedModel> {
    const buffers = await Promise.all(
      (json.buffers ?? []).map(async (b: any) => {
        if (b.uri?.startsWith('data:')) return this.data(b.uri);
        const r = await fetch(new URL(b.uri, base));
        if (!r.ok) throw new Error(`Unable to load glTF buffer: ${r.status}`);
        return r.arrayBuffer();
      }),
    );
    return this.build(json, buffers, base);
  }
  private data(uri: string) {
    const raw = atob(uri.split(',')[1]),
      bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes.buffer;
  }
  private read(json: any, buffers: ArrayBuffer[], index: number): Accessor {
    const a = json.accessors?.[index],
      b = json.bufferViews?.[a?.bufferView],
      buf = buffers[b?.buffer ?? 0];
    if (!a || !b || !buf) throw new Error(`Invalid glTF accessor ${index}`);
    const size = a.type === 'SCALAR' ? 1 : a.type === 'VEC2' ? 2 : a.type === 'VEC3' ? 3 : a.type === 'VEC4' ? 4 : 0;
    const bytes = a.componentType === 5121 ? 1 : a.componentType === 5123 ? 2 : 4;
    const stride = b.byteStride ?? size * bytes,
      start = (b.byteOffset ?? 0) + (a.byteOffset ?? 0),
      dv = new DataView(buf),
      values: number[] = [];
    const get = (o: number) =>
      a.componentType === 5126
        ? dv.getFloat32(o, true)
        : a.componentType === 5125
          ? dv.getUint32(o, true)
          : a.componentType === 5123
            ? dv.getUint16(o, true)
            : dv.getUint8(o);
    for (let i = 0; i < a.count; i++) for (let j = 0; j < size; j++) values.push(get(start + i * stride + j * bytes));
    return { values, count: a.count, size };
  }
  private build(json: any, buffers: ArrayBuffer[], _base: URL): LoadedModel {
    const root = new Node();
    const meshGroups = (json.meshes ?? []).map((m: any) => {
      const group = new Node();
      for (const prim of m.primitives ?? []) {
        if (prim.attributes?.POSITION === undefined) continue;
        const pos = this.read(json, buffers, prim.attributes.POSITION).values;
        let positions = pos,
          normals =
            prim.attributes.NORMAL !== undefined ? this.read(json, buffers, prim.attributes.NORMAL).values : undefined,
          uvs =
            prim.attributes.TEXCOORD_0 !== undefined
              ? this.read(json, buffers, prim.attributes.TEXCOORD_0).values
              : undefined;
        if (prim.indices !== undefined) {
          const idx = this.read(json, buffers, prim.indices).values;
          const expand = (src: number[] | undefined, n: number) =>
            src ? idx.flatMap((i) => src.slice(i * n, i * n + n)) : undefined;
          positions = expand(pos, 3)!;
          normals = expand(normals, 3);
          uvs = expand(uvs, 2);
        }
        const pbr = json.materials?.[prim.material]?.pbrMetallicRoughness;
        group.add(
          new Mesh(
            new BufferGeometry(positions, normals, uvs),
            new StandardMaterial({
              color: '#b5b1c6',
              roughness: pbr?.roughnessFactor ?? 0.5,
              metalness: pbr?.metallicFactor ?? 0,
            }),
          ),
        );
      }
      return group;
    });
    const apply = (n: any, t: Node) => {
      if (n.matrix) t.matrixOverride = new Float32Array(n.matrix);
      else {
        if (n.translation) {
          const [tx, ty, tz] = readTriple(n.translation, 'translation');
          t.position.set(tx, ty, tz);
        }
        if (n.scale) {
          const [sx, sy, sz] = readTriple(n.scale, 'scale');
          t.scale.set(sx, sy, sz);
        }
        if (n.rotation) {
          const [x, y, z, w] = n.rotation;
          const sinr = 2 * (w * x + y * z),
            cosr = 1 - 2 * (x * x + y * y),
            sinp = 2 * (w * y - z * x),
            siny = 2 * (w * z + x * y),
            cosy = 1 - 2 * (y * y + z * z);
          t.rotation.set(
            Math.atan2(sinr, cosr),
            Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI) / 2 : Math.asin(sinp),
            Math.atan2(siny, cosy),
          );
        }
      }
    };
    const visit = (i: number, parent: Node) => {
      const n = json.nodes?.[i];
      if (!n) return;
      const container = new Node();
      apply(n, container);
      const group = n.mesh === undefined ? null : meshGroups[n.mesh];
      if (group && group.children.length) {
        apply(n, group);
        parent.add(group);
      } else parent.add(container);
      for (const child of n.children ?? []) visit(child, group && group.children.length ? group : container);
    };
    for (const i of json.scenes?.[json.scene ?? 0]?.nodes ?? []) visit(i, root);
    if (
      !root.children.some((child) => {
        let found = false;
        child.traverse((n) => {
          if (n instanceof Mesh) found = true;
        });
        return found;
      })
    )
      for (let i = 0; i < (json.nodes ?? []).length; i++) if (json.nodes[i].mesh !== undefined) visit(i, root);
    if (
      !root.children.some((child) => {
        let found = false;
        child.traverse((n) => {
          if (n instanceof Mesh) found = true;
        });
        return found;
      })
    )
      throw new Error('glTF scene contains no renderable meshes');
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    root.traverse((n) => {
      if (n instanceof Mesh)
        for (let i = 0; i < n.geometry.positions.length; i += 3) {
          min[0] = Math.min(min[0], n.geometry.positions[i]);
          min[1] = Math.min(min[1], n.geometry.positions[i + 1]);
          min[2] = Math.min(min[2], n.geometry.positions[i + 2]);
          max[0] = Math.max(max[0], n.geometry.positions[i]);
          max[1] = Math.max(max[1], n.geometry.positions[i + 1]);
          max[2] = Math.max(max[2], n.geometry.positions[i + 2]);
        }
    });
    const center: [number, number, number] = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
      radius = Math.max(Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2, 0.0001);
    root.position.set(-center[0], -center[1], -center[2]);
    if (radius > 3) root.scale.set(3 / radius, 3 / radius, 3 / radius);
    return { scene: root, animations: json.animations ?? [], bounds: { center, radius } };
  }
}
