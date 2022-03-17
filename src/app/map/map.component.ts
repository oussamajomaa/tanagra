import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../services/data.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

import { Options } from "@angular-slider/ngx-slider";
import { FunctionsService } from '../services/functions.service';
import { Layers } from './layers';
import { AuthService } from '../services/auth.service';


@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {

	@ViewChild('myInput') myInput: ElementRef;

	value: number = 5;
	options: Options = {
		showTicksValues: true,
		stepsArray: []
	};

	clusters: L.MarkerClusterGroup
	map: any
	locations = []
	country = ''
	countries = []
	coords = []
	marker: any
	markers = []
	loading = false
	geojson: any
	text: string
	foundCities = []
	notFoundCities: any = []
	duplicatedCities: any = []
	notDuplicatedCities: any = []
	allNotDuplicatedCities: any = []
	foundCountries: any = []
	foundRivers: any = []
	groupRivers: any = []
	arr: any = []
	file: any;
	msg: string
	polyline: any
	cities = []
	ids = []
	bounds: any
	places: any = []
	wordList = []
	fileName = '';
	spacyList = []
	spacyText = ""
	mainLayer: any
	uploadFile: boolean
	textArea: boolean = true
	groupeByList: any
	listOfText = []
	listOfDate = []
	textSelected = ""
	dateSelected = ""
	allCities = []
	noRepeatedCities: any = []
	notFoundRepeatedCities: any = []
	groupCountries = []
	nominatims: any = []
	onCenter = false
	onCartographier = true
	countryMarkers: any = []
	countrtyCoords: any = []
	riverMarkers: any = []
	riverCoords: any = []
	constructor(
		private dataService: DataService,
		private http: HttpClient,
		private router: Router,
		private fs: FunctionsService,
		public auth: AuthService

	) { }

	ngAfterViewInit(): void {
		this.dataService.getLocation().subscribe((res: any) => {
			this.locations = res
		})
		this.map = this.fs.createMap()
		this.getRiver()
		this.fs.getCountryCoords().subscribe((res: any) => this.countrtyCoords = res)
		this.fs.getRiverCoords().subscribe((res: any) => this.riverCoords = res)


	}

	createMap(lat = 0, lng = 0, z = 2) {
		let baseMaps = new Layers().getBaseMap()

		this.map = L.map('map').setView([lat, lng], z);
		this.mainLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			minZoom: 1,
			maxZoom: 20,
			attribution: 'OSM'
		});
		this.mainLayer.addTo(this.map);

		var marker = L.markerClusterGroup()
		const overlayMaps = {
			'GeoJson Markers': marker
		}

		L.control.layers(baseMaps).addTo(this.map)
		// this.map.addControl(searchControl);	
	}


	// isClicked = true
	onSelectTextArea(e) {
		this.textArea = true
		this.onCartographier = true
		this.clearText()

	}

	onSelectUploadFile(e) {
		this.clearText()
		this.textArea = false
	}

	// Vider le textarea
	clearText() {
		this.groupCountries = []
		this.duplicatedCities = []
		this.multiDuplicatedCities = []
		this.notFoundCities = []
		this.foundCities = []
		this.notDuplicatedCities = []
		this.allNotDuplicatedCities = []
		this.foundCountries = []
		this.foundRivers = []
		this.groupRivers = []
		this.places = []
		this.allCities = []
		this.listOfText = []
		this.markers = []
		this.text = ''
		this.msg = ""
		this.fileName = ""
		this.listOfDate = []
		this.listOfText = []
		this.notFoundRepeatedCities = []
		this.noRepeatedCities = []
		this.geojson = []
		this.loading = false
		this.onCartographier = true
		if (this.map) this.map.remove()
		this.map = this.fs.createMap()
	}



	isUnkown = false
	// Send unkown location to Nominatim to get coordinate and country name
	unkownLocation() {
		this.nominatims = []
		let notFound = this.notFoundRepeatedCities.map(location => {
			return location.city
		})
		notFound.map((place, i, row) => {
			this.isUnkown = true
			this.http.get(`${environment.url_py}/unkown`, { params: { place: place } })
				.subscribe((res: any) => {
					if (res.length != 0) {
						this.nominatims.push(res[0])
					}
					if (i + 1 === row.length) {
						this.isUnkown = false
						this.router.navigate(["location"], { queryParams: { nominatims: JSON.stringify(this.nominatims) } })
					}
				})
		})
	}

	sendToSpacy(event) {
		this.notFoundRepeatedCities = []
		this.notDuplicatedCities = []
		this.foundCities = []
		this.noRepeatedCities = []
		this.duplicatedCities = []
		this.multiDuplicatedCities = []
		this.notFoundCities = []
		this.allNotDuplicatedCities = []
		this.markers = []
		this.foundCountries = []
		this.foundRivers = []
		this.groupRivers = []
		this.geojson = []
		this.groupCountries = []
		if (this.clusters) this.clusters.clearLayers()

		this.msg = ""
		if (this.textArea) {
			this.loading = true
			if (this.text) {
				this.onCartographier = false
				this.http.get(`${environment.url_py}/text`, { params: { text: this.text } }).subscribe((res: any) => {
					this.spacyList = res
					this.identifyCity(this.spacyList)
				})
			}
			// this.clearText()
		}

		if (!this.textArea) {
			this.clearText()
			this.loading = true
			this.file = event.target.files[0];
			this.myInput.nativeElement.value = ""

			if (this.file) {
				let length = this.file.name.split('.').length
				let ext = this.file.name.split('.')[length - 1]
				if (ext === 'txt' && this.file.size < 1000000) {
					this.fileName = this.file.name
					const formData = new FormData();
					formData.append("name", this.file.name);
					formData.append("file", this.file, this.file.name);
					this.sendFormData(formData)
				}
				else {
					if (ext === 'zip' && this.file.size < 350000) {
						this.fileName = this.file.name
						const formData = new FormData();
						formData.append("name", this.file.name);
						formData.append("file", this.file, this.file.name);
						this.sendFormData(formData)
					}
					else {
						this.myInput.nativeElement.value = ""
						this.loading = false
						alert('Le fichier zip doit être moin de 350 ko et le txt moins de 1000 ko!')
					}
				}


			}
		}
	}

	sendFormData(formData: any) {
		// Send file to Spacy and get response
		this.http.post(`${environment.url_py}/file`, formData).subscribe((res: any) => {
			this.spacyList = res
			// Regrouper les noms des fichiers dans la liste listOfText
			this.groupeByList = this.fs.groupBy(this.spacyList, item => item.fileName)

			for (let key of this.groupeByList) {
				let item = {
					legend: key[0],
					value: key[1][0].fileDate,
				}
				this.listOfText.push(item)

			}

			// Regrouper les dates des fichiers dans la liste listOfDate
			this.groupeByList = this.fs.groupBy(this.spacyList, item => item.fileDate)

			for (let key of this.groupeByList) {
				let item = {
					value: key[0]
				}
				this.listOfDate.push(item)
			}
			this.listOfDate = this.listOfDate.sort((a, b) => {
				if (parseInt(a.value) > parseInt(b.value)) return 1
				if (parseInt(a.value) < parseInt(b.value)) return -1
				return 0
			})
			this.options.stepsArray = this.listOfDate
			this.identifyCity(this.spacyList)
		})
	}

	multiDuplicatedCities: any = []
	allCountries: any = []
	allRivers: any = []
	riverCordinate: any = []
	countryCordinate: any = []




	identifyCity(list: any = []) {

		this.loading = false

		// create list of spacy location
		const spacyLocation = list.map(entity => {
			return entity.city
		})

		// convertir la liste des lieux en une chaîne de caractères
		this.spacyText = spacyLocation.toString()


		if (this.spacyText != "") {
			// Itérer la liste des locations et chercher si une ville est existe dans la chaîne de caractères
			this.locations.map(location => {
				let cityRegex = new RegExp("\\b" + location.city + "\\b")
				if (this.spacyText.match(new RegExp(cityRegex, 'g'))) {
					this.foundCities.push(location)
				}
				let countryRegex = new RegExp("\\b" + location.country + "\\b")
				if (this.spacyText.match(new RegExp(countryRegex, 'g'))) {
					this.foundCountries.push(location.country)
				}
			})
		}




		// Récupérer les lieux non identifiés et les mettre dans une liste notFoundCities
		list.forEach(item => {
			if ((!this.foundCities.find(location => item.city.trim() === location.city))) {
				if (item.city.length > 2) this.notFoundCities.push(item)
			}
		})

		if (this.notFoundCities.length > 1) {
			this.fs.sortListObject(this.notFoundCities)
		}
		let ex = []
		this.notFoundCities.map(location => {
			location.city = location.city.replace(/\n/g, '')
			return location
		})



		// ####################################################
		// récupérer les lieux dupliqués et les mettre dans la list repeatedCities
		let ids = {}
		let repeatedCities = []
		this.foundCities.forEach((val) => {
			if (ids[val.city]) {
				repeatedCities.push(val.city)
			}
			else {
				ids[val.city] = true
			}
		})


		// Recupérer les villes non dupliqueés et les mettre dans la liste notDuplicatedCities
		// et les villes dupliqueés dans la liste duplicatedCities
		this.foundCities.map(location => {
			if (!repeatedCities.find(city => city === location.city)) {
				this.notDuplicatedCities.push(location)
			}
			else this.duplicatedCities.push(location)
		})


		if (this.duplicatedCities.length > 1) {
			this.fs.sortListObject(this.duplicatedCities)
		}


		// Regroupe les lieux duplicqués selon le nom du lieu et les stocker dans la list multiDuplicatedCities
		if (this.duplicatedCities.length > 1) {
			let nrc = this.fs.groupBy(this.duplicatedCities, item => item.city)
			for (let key of nrc) {
				this.multiDuplicatedCities.push(key[1])
			}
		}

		list.forEach(item => {
			this.notDuplicatedCities.forEach(location => {
				let splitItem = item.city.split(' ')
				splitItem.forEach((el) => {
					if (el.trim() === location.city) {
						item.city = el
						item.lat = location.lat
						item.lng = location.lng
						item.country = location.country
						this.allNotDuplicatedCities.push(item)
					}

				})
			})
		})

		if (this.allNotDuplicatedCities.length > 1) {
			this.fs.sortListObject(this.allNotDuplicatedCities)
		}
		this.allNotDuplicatedCities.map(location => {
			location.city = location.city.replace(/\n/g, '')
			return location
		})
		let nrc = this.fs.groupBy(this.allNotDuplicatedCities, item => item.city)
		for (let key of nrc) {
			let item = {
				city: key[0],
				country: key[1][0].country
			}
			this.noRepeatedCities.push(item)
		}

		// ##########################  COUNTRY ####################### //

		// regroupe la liste des foundCountries par le nom de country
		this.foundCountries = this.fs.groupBy(this.foundCountries, location => location)

		this.groupCountries = []
		for (let key of this.foundCountries) {
			this.groupCountries.push(key[0])
		}
		this.allCountries = []
		this.spacyList.map(location => {
			this.groupCountries.map((country: any) => {
				if (location.city === country) {
					let item = {
						country: country,
						fileName: location.fileName,
						fileDate: location.fileDate
					}

					this.allCountries.push(item)
				}
			})
		})
		this.countryCordinate = []
		// add les pays à liste des lieux trouvés
		// this.groupCountries.map(country => {
		// 	let item = {
		// 		city: country,
		// 		country: country,
		// 		occurence: 1
		// 	}
		// 	this.noRepeatedCities.push(item)
		// })
		// // add les fleuves à liste des lieux trouvés
		// this.foundRivers.map(river => {
		// 	this.noRepeatedCities.push({ city: river.name, country: river.name, occurence: 1 })
		// })

		this.fs.getOccurence(this.noRepeatedCities, this.spacyList)

		let arr = []
		let nfc = this.fs.groupBy(this.notFoundCities, item => item.city)
		for (let key of nfc) {
			let item = {
				city: key[0],
			}
			arr.push(item)
		}


		// arr = notFoundRepeatedCities
		// notFoundRepeatedCities
		// remove pays de la liste
		arr.map(location => {

			if (!this.groupCountries.find(country => country === location.city)) {
				this.notFoundRepeatedCities.push(location)
			}
		})




		// // remove rivère de la liste
		// this.foundRivers.map(river => {
		// 	this.notFoundRepeatedCities = this.notFoundRepeatedCities.filter(location => {
		// 		location.city != river.name
		// 	})
		// })

		// this.sortListObject(notFoundRepeatedCities)

		// this.geoJson('assets/data/pays.json', country.country)
		// console.log(this.allCountries);
		// this.allCountries.map(item => {
		// 	this.geoJson('assets/data/pays.json', item.country)
		// })
		// this.countryMarkers = []
		// this.allCountries.map(item => {
		// 	this.getCountryCordinate(item.country)
		// })




		// ####################################################
		// Afficher les villes non dupliquées
		if (this.notDuplicatedCities.length > 0) {
			this.places = this.allNotDuplicatedCities
			this.displayOnMap()
		}
		else {
			this.msg = "Aucun lieu trouvé !!!"
		}

	}

	getCountryCordinate(country: string) {
		this.countrtyCoords['features'].map((location: any) => {
			if (location['properties']['admin'] === country) {
				let item
				if (Array.isArray(location.geometry.coordinates[0][0][0])) {
					item = {
						lat: (location['geometry']['coordinates'][0][0][0][0]),
						lng: (location['geometry']['coordinates'][0][0][0][1])
					}
					this.countryMarkers.push((item))
				}
				else {
					item = {
						lat: (location['geometry']['coordinates'][0][0][0]),
						lng: (location['geometry']['coordinates'][0][0][1])
					}
					this.countryMarkers.push((item))
				}
			}
		})
	}

	getRiverCordinate() {
		const spacyLocation = this.spacyList.map(entity => {
			return entity.city
		})

		// convertir la liste des lieux en une chaîne de caractères
		this.spacyText = spacyLocation.toString()

		if (this.spacyText != "") {
			// Itérer la liste des locations et chercher si une ville est existe dans la chaîne de caractères
			this.rivers.map(river => {
				let riverRegex = new RegExp("\\b" + river.name + "\\b")
				if (this.spacyText.match(new RegExp(riverRegex, 'g'))) {
					this.foundRivers.push(river)
				}
			})
		}
		// this.foundRivers.map(river => {
		// 	this.geoJson('assets/data/river.json', river.name)
		// })
		this.foundRivers.map(item => {

			this.riverCoords.features.map(river => {
				if (river.properties.name === item.name) {
					this.riverMarkers.push(
						{
							name: item.name,
							lat: river.geometry.coordinates[0][0],
							lng: river.geometry.coordinates[0][1]
						}
					)
				}
			})

		})


		// this.riverMarkers = []
		let rm = []
		let rf = []
		
		this.spacyList.map(location => {
			this.riverMarkers.map((river: any) => {
				let item
				if (location.city === river.name) {
					item = {
						name: river.name,
						lat: river.lat,
						lng: river.lng,
						fileDate: location.fileDate,
						fileName: location.fileName
					}
					rm.push(item);
				}
			})
			
			this.foundRivers.map(river => {
				let item
				if (location.city === river.name) {
					item = {
						name: river.name,
						fileDate: location.fileDate,
						fileName: location.fileName
					}
					rf.push(item);
				}
			})
		})
		this.foundRivers = rf
		this.riverMarkers = rm
		

	}

	confirmedLocation = []
	confirmLocation(event, id) {

		this.onCenter = false
		if (event.target.checked) {
			let loc = this.locations.filter(location => {
				return location.id === parseInt(id)
			})

			// récupperer la location demandée selon l'id
			let item = loc[0]
			// Add fileDate and fileName to object item
			this.spacyList.forEach(element => {
				if (element.city.search(item.city)) {
					item.fileDate = element.fileDate
					item.fileName = element.fileName
				}
			})


			// remove les locations de la listes des ambigues selon le nom de la location choisie
			// this.allNotDuplicatedCities = this.allNotDuplicatedCities.filter(location => {
			// 	return location.city != item.city
			// })
			this.allNotDuplicatedCities.push(item)

			this.fs.sortListObject(this.allNotDuplicatedCities)

			this.confirmedLocation = this.confirmedLocation.filter(location => {
				return location.city != item.city
			})

			// Ajouter le lieu confirmé à la list confirmedLocation
			this.confirmedLocation.push(item)

			this.noRepeatedCities = []
			let nrc = this.fs.groupBy(this.allNotDuplicatedCities, item => item.city)
			for (let key of nrc) {
				let item = {
					city: key[0],
					country: key[1][0].country
				}
				this.noRepeatedCities.push(item)
				this.fs.sortListObject(this.noRepeatedCities)
				this.fs.getOccurence(this.noRepeatedCities, this.spacyList)
			}
		}

	}

	onFirsteCenter = true
	displayOnMap() {

		// this.textSelected = ""
		// this.dateSelected = ""
		this.onFirsteCenter = true
		// this.onCenter = true
		this.fs.getOccurence(this.allNotDuplicatedCities, this.spacyList)

		this.markers = []

		this.initCoordsAll()
		console.log((this.countryMarkers));
		

		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(this.allNotDuplicatedCities)

		// remove location from confused list
		this.confirmedLocation.forEach((element) => {
			this.duplicatedCities = this.duplicatedCities.filter(location => {
				return location.city != element.city
			})
			// let index = this.duplicatedCities.indexOf(element)
			// this.duplicatedCities.splice(index, 1)
		})
		this.multiDuplicatedCities = []
		if (this.duplicatedCities.length > 1) {
			let nrc = this.fs.groupBy(this.duplicatedCities, item => item.city)
			for (let key of nrc) {
				this.multiDuplicatedCities.push(key[1])
			}
		}
		this.confirmedLocation = []

	}

	//  Cette methode pour recentrer la carte selon les markers en cliquant sur le bouton centrer
	onSelectText(text) {
		// this.onFirsteCenter = false
		// this.onCenter = true
		this.textSelected = text
		let arr = []
		this.allNotDuplicatedCities.filter(place => {
			if (place.fileName === this.textSelected) arr.push(place)
		})

		console.log(text);
		// Récupérer l'occurence de chaque lieu
		this.fs.getOccurence(arr, this.spacyList)

		this.initCoordsFileName(text)

		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(arr)
	}

	initCoordsFileName(attr:string){
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()


		// filter country with file text name
		let c = this.allCountries.filter(location => {
			return location.fileName === attr
		})

		// display country on map
		c.map(item => {
			this.geoJson('assets/data/pays.json', item.country)
		})

		// filter river with file text name
		let r = this.foundRivers.filter(location => {
			return location.fileName === attr
		})

		// display river on map
		r.map(item => {
			this.geoJson('assets/data/river.json', item.name)
		})

		// filter river marker with file text name
		let rm = this.riverMarkers.filter(location => {
			return location.fileName === attr
		})

		
		//filter country marker with file text name
		c.map(location => {
			this.getCountryCordinate(location.country)
		})
	}

	initCoordsFileDate(attr:string){
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()


		// filter country with file text name
		let c = this.allCountries.filter(location => {
			return location.fileDate === attr
		})

		// display country on map
		c.map(item => {
			this.geoJson('assets/data/pays.json', item.country)
		})

		// filter river with file text name
		let r = this.foundRivers.filter(location => {
			return location.fileDate === attr
		})

		// display river on map
		r.map(item => {
			this.geoJson('assets/data/river.json', item.name)
		})

		// filter river marker with file text name
		let rm = this.riverMarkers.filter(location => {
			return location.fileDate === attr
		})

		
		//filter country marker with file text name
		c.map(location => {
			this.getCountryCordinate(location.country)
		})
	}

	initCoordsAll(){
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()

		// display country on map
		this.allCountries.map(item => {
			this.geoJson('assets/data/pays.json', item.country)
		})

		// display river on map
		this.foundRivers.map(item => {
			this.geoJson('assets/data/river.json', item.name)
		})

		//filter country marker with file text name
		this.allCountries.map(location => {
			this.getCountryCordinate(location.country)
		})
	}

	onSelectDate(date) {
		this.onFirsteCenter = false
		this.onCenter = false
		this.dateSelected = date
		let arr = []

		this.allNotDuplicatedCities.filter(place => {
			if (place.fileDate === this.dateSelected) arr.push(place)
		})

		// Récupérer l'occurence de chaque lieu
		this.fs.getOccurence(arr, this.spacyList)

		this.initCoordsFileDate(date)
		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(arr)
	}

	onSelectALl() {
		this.onFirsteCenter = true
		this.onCenter = false
		let arr = this.allNotDuplicatedCities
		// Récupérer l'occurence de chaque lieu
		this.fs.getOccurence(arr, this.spacyList)

		this.initCoordsAll()
		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(arr)

	}

	// Cette methode ajoute les markers sur la carte
	getMarkers(arr: any[]) {
		this.markers = []
		if (this.map) this.map.remove()
		this.map = this.fs.createMap()
		this.clusters = L.markerClusterGroup({});
		let iconSize

		arr.map(location => {
			if (this.onCenter) iconSize = 20
			// else iconSize = 20 + location.occurence
			else iconSize = 20
			this.marker = L.marker([location.lat, location.lng],
				{
					icon: new L.Icon(
						{
							iconUrl: 'assets/icons/circle_blue.png',
							iconSize: [iconSize, iconSize],
							iconAnchor: [6, 10],
							popupAnchor: [5, -10],
						}
					),
				}
			)

			this.marker.bindPopup(`<center><span>${location.city}</span><span> - </span><span>${location.country}</span></center><br><center><span>Occurrence: ${location.occurence}</span> - <span>${location.fileName} </span></center>`)
			this.markers.push(this.marker)


			// this.map.setView([location.lat, location.lng],5)
			this.clusters.addLayer(this.marker)
			this.map.addLayer(this.clusters)
		})

		// add markers country to markers
		this.countryMarkers.map(location => {
			let m = L.marker([location.lat, location.lng])
			this.markers.push(m)
		})

		// add markers river to markers
		this.riverMarkers.map(location => {
			let m = L.marker([location.lng, location.lat])
			this.markers.push(m)
		})


		// Contenir tous les markers sur la carte
		if (this.markers.length > 1) {
			if (this.markers[0]._latlng.lat != this.markers[this.markers.length - 1]._latlng.lat &&
				this.markers[0]._latlng.lng != this.markers[this.markers.length - 1]._latlng.lng) {
				this.bounds = L.featureGroup(this.markers);
				this.map.fitBounds(this.bounds.getBounds(), { padding: [0, 0] });
			}
		}
	}

	// Sauvegarder les ambigus et les lieus non reconnus dans deux fichier csv
	exportCSV() {

		this.fs.exportCSV(this.noRepeatedCities, this.notFoundRepeatedCities)
	}

	//dessiner les frontières
	geoJson(url: string, country: string) {
		this.http.get(url).subscribe((res: any) => {
			this.geojson = res
			this.geojson = this.geojson.features.filter(data => data.properties.name === country)
			L.geoJSON(this.geojson, { style: {} }).addTo(this.map).bindPopup(country)
		})
	}

	rivers: any = []
	// récupérer les noms des rivières
	getRiver() {
		this.dataService.getRiver().subscribe((res: any) => {
			let nrc = this.fs.groupBy(res.features, river => river.properties.name)
			for (let key of nrc) {
				this.rivers.push({ name: key[0], type: key[1][0].properties.featureclass.split(' ')[0] })
			}
		})

	}



}
















