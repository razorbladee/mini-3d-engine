export type AudioHooks={play?(id:string):void;stop?(id:string):void;setVolume?(id:string,volume:number):void};
export class NullAudioHooks implements AudioHooks { play(_id:string){} stop(_id:string){} setVolume(_id:string,_volume:number){} }
