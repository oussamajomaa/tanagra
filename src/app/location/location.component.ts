import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { AfterViewInit, Component, HostListener } from '@angular/core';
import { DataService } from '../services/data.service';
import * as L from 'leaflet';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();
const searchControl = GeoSearchControl({
	provider: provider,
});

@Component({
	selector: 'app-location',
	templateUrl: './location.component.html',
	styleUrls: ['./location.component.css']
})
export class LocationComponent implements AfterViewInit {
	locations = []
	countries = []
	cities = []
	loading = false
	country = ''
	city = ''
	lat: number
	lng: number
	map: any
	id_country: number
	geojson: any
	mainLayer: any
	width = window.innerWidth
	nominatim:any=[]

	constructor(
		private dataService: DataService,
		private http: HttpClient,
		private route: ActivatedRoute,
		private toastService: ToastrService,
	) {
			
		this.route.queryParamMap.subscribe((params: any) => {
			if (params.params.nominatims)
			this.locations = JSON.parse(params.params.nominatims)			
		})
	}

	@HostListener('window:resize', ['$event'])

	onResize(event) {
		this.width = window.innerWidth;	
	}

	ngAfterViewInit(): void {
		// Récupérer tous les pays et les stocker dans une listes countries
		this.dataService.getCountries()
			.subscribe((res: any) => {
				this.countries = res
				this.loading = true
			})
		// fin ** Récupératin tous les pays **
		this.createMap()
		this.getLatLng()
	}

	createMap(lat = 0, lng = 0, z = 2) {
		this.map = L.map('mapLocation').setView([lat, lng], z);

		this.mainLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			minZoom: 1,
			maxZoom: 20,
			attribution: 'OSM'
		});
		this.mainLayer.addTo(this.map);
		this.map.addControl(searchControl);


	}

	getLatLng() {
		this.map.on('click', (e) => {
			this.lat = (e.latlng.lat).toFixed(4)
			this.lng = (e.latlng.lng).toFixed(4)

		})
	}

	getIdCountry(country:string){
		let id
		this.countries.filter((location:any) => {
			if(location.country_fr === country)
			return this.id_country = location.id
		})
	}

	onAddLocation() {
		this.getIdCountry(this.country)
		// Récupérer l'id du pays
		// let id
		// this.countries.filter(country => {
		// 	if (country.country_fr === this.country) {
		// 		id = country.id
		// 		return id
		// 	}
		// })
		// this.id_country = id
		// fin ** Récupératin l'id du pays **

		// Construire un objet location et 'insérer dans la list locations
		const location = {
			country: this.country,
			city: this.city,
			lat: this.lat,
			lng: this.lng,
			id_country: this.id_country
		}		
		this.locations.push(location)
		this.country = null
		this.city = null
		this.lat = null
		this.lng = null
		// fin ** Insértion de l'objet **
	}

	removeCity(city) {
		// Supprimer un objet (location) de la liste locations
		this.locations = this.locations.filter(location => {
			return location.city != city
		})
	}

	editCity(event,i){
		this.locations[i].city = event.target.value	
	}

	onSubmit() {
		// Itération de la liste locations et envoyer chaque élément à la BDD
		this.locations.map(location => {
			this.getIdCountry(location.country)
			location.id_country = this.id_country			
			this.http.post(`${environment.url}/add-city`, location)
				.subscribe(res => res)
		})
		this.toastService.success("Les lieux ont été ajoutés!!!");
		this.locations = []
	}


	csvToRowArray: any
	csv = []
	uploadCSV(e) {
		let file = e.target.files[0]
		let fileReader = new FileReader();
		fileReader.onload = (e) => {

			this.csvToRowArray = fileReader.result
			let allTextLines = [];
			allTextLines = this.csvToRowArray.split(/\r|\n|\r/);
			allTextLines.shift()
			allTextLines.map((element: any) => {
				let arr = element.split(',')
				if (arr.length > 1) {
					if (arr[0] && typeof (arr[0]) === 'string' &&
						arr[1] && typeof (arr[1]) === 'string' &&
						arr[2] && typeof (parseFloat(arr[2])) === 'number' &&
						arr[3] && typeof (parseFloat(arr[3])) === 'number'
					) {
						let item = {
							city: arr[0],
							country: arr[1],
							lat: arr[2],
							lng: arr[3]
						}
						this.csv.push(item)
					}
				}

			})
			this.locations = this.csv

		}
		fileReader.readAsText(file);
		// https://therichpost.com/how-to-read-csv-file-in-angular-10/
	}


}
