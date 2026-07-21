// Network stub data (Rwanda). STATIONS is still used by the map preview marker layer and the add-stop
// parent picker; routes and fares now come from the live API (see RouteFares / RouteManagementPage).

export interface Station {
  id: string;
  name: string;
  lng: number;
  lat: number;
}
export const STATIONS: Station[] = [
  { id: 's1', name: 'Nyabugogo', lng: 30.0434, lat: -1.9397 },
  { id: 's2', name: 'Musanze', lng: 29.6349, lat: -1.4998 },
  { id: 's3', name: 'Rubavu', lng: 29.2586, lat: -1.6777 },
  { id: 's4', name: 'Huye', lng: 29.7407, lat: -2.5967 },
  { id: 's5', name: 'Nyagatare', lng: 30.3272, lat: -1.2929 },
  { id: 's6', name: 'Muhanga', lng: 29.7554, lat: -2.0853 },
];
