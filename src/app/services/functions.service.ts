import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Layers } from '../map/layers';


@Injectable({
	providedIn: 'root'
})
export class FunctionsService {
	map:any
	constructor(private http:HttpClient) { }

	createMap(lat = 0, lng = 0, z = 2) {
		let baseMaps = new Layers().getBaseMap()

		this.map = L.map('map').setView([lat, lng], z);
		let mainLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			minZoom: 1,
			maxZoom: 20,
			attribution: 'OSM'
		});
		mainLayer.addTo(this.map);

		var marker = L.markerClusterGroup()
		const overlayMaps = {
			'GeoJson Markers': marker
		}

		L.control.layers(baseMaps).addTo(this.map)
		return this.map
	}
	// Transform string into Camel Case
	toCamelCase(s) {
		return s.split(/(?=[A-Z])/).map(function (p) {
			return p.charAt(0).toUpperCase() + p.slice(1);
		}).join(' ');
	}

	// Sort list of Objects
	sortListObject(list:[]) {
		list.sort((a: any, b: any) => {
			if (a.city > b.city) return 1
			if (a.city < b.city) return -1
			return 0
		})
	}

	// Cette methode va regrouper la liste selon le nom du fichier
	groupBy(list, keyGetter) {
		const map = new Map();
		list.forEach((item) => {
			const key = keyGetter(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return map;
	}


	// methode pour créer un fichier csv
	downloadFile(data: any, name: string) {
		const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
		const header = Object.keys(data[0]);
		const csv = data.map((row) =>
			header
				.map((fieldName) => JSON.stringify(row[fieldName], replacer))
				.join(',')
		);
		csv.unshift(header.join(','));
		const csvArray = csv.join('\r\n');

		const a = document.createElement('a');
		const blob = new Blob([csvArray], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);

		a.href = url;
		a.download = name;
		a.click();
		window.URL.revokeObjectURL(url);
		a.remove();
	}

	// Sauvegarder les ambigus et les lieus non reconnus dans deux fichier csv
	exportCSV(foundCities:any[],notFoundCities:any[]) {
		let found = []
		foundCities.map(location => found.push({ place: location.city, country: location.country, occurence:location.occurence, mapped:'yes' }))
		
		// this.downloadFile(found, 'reconnu')
		let notFound = []
		notFoundCities.map(location => notFound.push({ place: location.city, country:"", occurence:"", mapped:'no'  }))
		let list = found.concat(notFound)
		this.downloadFile(list, 'file')
	}

	getOccurence(arr1:any[],arr2:any[]){
		arr1.map(location => {
			// return location.occurence = this.wordList.filter(word => word === location.city).length
			return location.occurence = arr2.filter(item => item.city.match("\\b" + location.city + "\\b")).length
		})
	}


	

	getCountryCoords() {
		return this.http.get('assets/data/pays.json')
	}

	getRiverCoords() {
		return this.http.get('assets/data/river.json')
	}

	getDifferenceRiver(array1, array2) {
		return array1.filter(object1 => {
		  return !array2.some(object2 => {
			return object1.city === object2.name;
		  });
		});
	  }

	  getDifferenceCountry(array1, array2) {
		return array1.filter(object1 => {
		  return !array2.some(object2 => {
			return object1.city === object2.country;
		  });
		});
	  }

	  getDifferencePlaceFound(array1, array2) {
		return array1.filter(object1 => {
		  return !array2.some(object2 => {
			return object1.city === object2.city;
		  });
		});
	  }


}
