declare module 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs' {
  import type { GridLayer, GridLayerOptions } from 'leaflet';

  export default class GoogleMutant extends GridLayer {
    constructor(options: GridLayerOptions & {
      type: 'roadmap';
      styles?: object[];
    });
  }
}
