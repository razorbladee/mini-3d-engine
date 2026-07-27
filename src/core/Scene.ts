import {Node} from './Node'; import type {Camera} from '../cameras/Camera'; export class Scene extends Node { background='#101522'; activeCamera:Camera|null=null; }
