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
		stepsArray: [],
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
	onAllFiles = true
	grs: any = [] // groupe of rivers

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
		this.dataService.getCountries().subscribe((res: any) => {
			this.countries = res
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
		this.onAllFiles = true
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
		this.onAllFiles = true
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
			this.listOfText = this.listOfText.sort((a, b) => {
				if (parseInt(a.value) > parseInt(b.value)) return 1
				if (parseInt(a.value) < parseInt(b.value)) return -1
				return 0
			})
			this.options.stepsArray = []

			// Regrouper les dates des fichiers dans la liste listOfDate
			this.groupeByList = this.fs.groupBy(this.spacyList, item => item.fileDate)
			for (let key of this.groupeByList) {
				let item = {
					legend: key[1][0].fileName,
					value: key[0]
				}
				this.listOfDate.push(item)
				this.options.stepsArray.push({value:key[0]})
			}
			this.listOfDate = this.listOfDate.sort((a:any, b:any) => {
				if (parseInt(a.value) > parseInt(b.value)) return 1
				if (parseInt(a.value) < parseInt(b.value)) return -1
				return 0
			})
			this.options.stepsArray = this.options.stepsArray.sort((a:any, b:any) => {
				if (parseInt(a.value) > parseInt(b.value)) return 1
				if (parseInt(a.value) < parseInt(b.value)) return -1
				return 0
			})
			// this.options.stepsArray = this.listOfDate
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
			})

			this.countries.map(item => {
				let countryRegex = new RegExp("\\b" + item.country_fr + "\\b")

				if (this.spacyText.match(new RegExp(countryRegex, 'g'))) {
					this.foundCountries.push(item.country_fr)
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
						item.departement = location.departement
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
				country: key[1][0].country,

			}
			this.noRepeatedCities.push(item)
		}

		// ##########################  COUNTRY ####################### //


		this.allCountries = []
		this.spacyList.map(location => {
			let splitLocation = location.city.split(' ')
			splitLocation.map(el => {
				this.foundCountries.map((country: any) => {
					if (el.trim() === country) {
						if (this.allCountries.filter(item => item.country === country).length === 0){

							let item = {
								country: country,
								fileName: location.fileName,
								fileDate: location.fileDate
							}
							this.allCountries.push(item)
						}
					}
				})
			})
		})
		// add les pays à liste des lieux trouvés
		this.allCountries.map(obj => {
			let item = {
				city: obj.country,
				country: 'country',
				occurence: 1
			}
			this.noRepeatedCities.push(item)
		})

		

		this.getRiverCordinate()
		let gr = this.fs.groupBy(this.foundRivers, item => item.name)
		this.grs = []
		for (let key of gr) {
			this.grs.push(key[0])
		}

		// // add les fleuves à liste des lieux trouvés
		this.grs.map(river => {
			this.noRepeatedCities.push({ city: river, country: 'river', occurence: 1 })
		})

		this.fs.getOccurence(this.noRepeatedCities, this.spacyList)

		let arr = []
		let nfc = this.fs.groupBy(this.notFoundCities, item => item.city)
		for (let key of nfc) {
			let item = {
				city: key[0],
			}
			arr.push(item)
		}

		

		arr.map(location => {
			if (!this.groupCountries.find(country => country === location.city)) {
				this.notFoundRepeatedCities.push(location)
			}
		})



		this.displayOnMap()
		// ####################################################
		// Afficher les villes non dupliquées
		if (this.notDuplicatedCities.length === 0) {
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
						lng: (location['geometry']['coordinates'][0][0][0][1]),
						country: country
					}
					this.countryMarkers.push((item))
				}
				else {
					item = {
						lat: (location['geometry']['coordinates'][0][0][0]),
						lng: (location['geometry']['coordinates'][0][0][1]),
						country: country
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

	// select count(*), city from town group by city order by count(*) desc
	// DELETE t1 FROM town t1 INNER JOIN town t2  WHERE      t1.id < t2.id      AND t1.city = t2.city     AND t1.departement = t2.departement;
	// DELETE t1 FROM town t1, town t2 WHERE t1.id < t2.id AND t1.city = t2.city AND t1.departement = t2.departement


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
			this.allNotDuplicatedCities = this.allNotDuplicatedCities.filter(obj => {
				return obj.city != item.city
			})
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
					country: key[1][0].country,
					departement: key[1][0].departement
				}
				this.noRepeatedCities.push(item)
				this.fs.sortListObject(this.noRepeatedCities)
				this.fs.getOccurence(this.noRepeatedCities, this.spacyList)
			}
		}
		
		// add les pays à liste des lieux trouvés
		this.allCountries.map(obj => {
			this.noRepeatedCities.push({city: obj.country, country: 'country', occurence: 1})
		})
		// add les fleuves à liste des lieux trouvés
		this.grs.map(river => {
			this.noRepeatedCities.push({ city: river, country: 'river', occurence: 1 })
		})

	}

	onFirsteCenter = true
	displayOnMap() {

		// this.textSelected = ""
		// this.dateSelected = ""
		this.onFirsteCenter = true
		this.onAllFiles = true
		// this.onAllFiles = false
		if (this.listOfDate.length > 0)	{
			this.textSelected = this.listOfDate[0].legend
			this.dateSelected = this.listOfDate[0].value
		}
		
		
		// this.onCenter = true
		this.fs.getOccurence(this.allNotDuplicatedCities, this.spacyList)

		this.markers = []
		this.initCoordsFileName(this.textSelected)
		// this.initCoordsAll()


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

		//remove rivère and country from the not found liste 
		this.notFoundRepeatedCities = (this.fs.getDifferenceRiver(this.notFoundRepeatedCities,this.rivers))
		this.notFoundRepeatedCities = (this.fs.getDifferenceCountry(this.notFoundRepeatedCities,this.allCountries))
		this.notFoundRepeatedCities = (this.fs.getDifferencePlaceFound(this.notFoundRepeatedCities,this.noRepeatedCities))	

		this.multiDuplicatedCities = []
		if (this.duplicatedCities.length > 1) {
			let nrc = this.fs.groupBy(this.duplicatedCities, item => item.city)
			for (let key of nrc) {
				this.multiDuplicatedCities.push(key[1])
			}
		}
		this.confirmedLocation = []

	}



	initCoordsFileName(attr: string) {
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()

		let groupFileName = this.fs.groupBy(this.allCountries, item => item.country + '|' + item.fileName)
		let gf = []
		for (let key of groupFileName) {
			gf.push({ country: key[0].split('|')[0], fileName: key[0].split('|')[1] })
		}

		//filter country with file text name
		let c = gf.filter(location => {
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
		if (c.length === 0) this.countryMarkers = []
		if (rm.length === 0) this.riverMarkers = []

	}

	initCoordsFileDate(attr: string) {
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()

		let groupFileDate = this.fs.groupBy(this.allCountries, item => item.country + '|' + item.fileDate)
		let gf = []
		for (let key of groupFileDate) {
			gf.push({ country: key[0].split('|')[0], fileDate: key[0].split('|')[1] })
		}

		//filter country with file text name
		let c = gf.filter(location => {
			return location.fileDate === attr.toString()
		})



		// filter country with file text name
		// c = this.allCountries.filter(location => {
		// 	return location.fileDate === attr
		// })


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

		if (c.length === 0) this.countryMarkers = []
		if (rm.length === 0) this.riverMarkers = []
	}

	initCoordsAll() {
		this.countryMarkers = []
		this.foundRivers = []
		this.riverMarkers = []
		this.getRiverCordinate()

		let groupFileDate = this.fs.groupBy(this.allCountries, item => item.country + '|' + item.fileDate)
		let gf = []

		for (let key of groupFileDate) {
			gf.push({ country: key[0].split('|')[0], fileDate: key[0].split('|')[1] })
		}



		// display country on map
		gf.map(item => {
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

		//remove rivère de la liste and country
		// this.notFoundRepeatedCities = (this.fs.getDifferenceRiver(this.notFoundRepeatedCities,this.rivers))
		// this.notFoundRepeatedCities = (this.fs.getDifferenceCountry(this.notFoundRepeatedCities,this.allCountries))
		// this.notFoundRepeatedCities = (this.fs.getDifferencePlaceFound(this.notFoundRepeatedCities,this.noRepeatedCities))	
	}

	//  Cette methode pour recentrer la carte selon les markers en cliquant sur le bouton centrer
	onSelectText(text) {
		// this.onFirsteCenter = false
		// this.onCenter = true
		this.onFirsteCenter = false
		this.textSelected = text
		this.onAllFiles = true
		let arr = []
		this.allNotDuplicatedCities.filter(place => {
			if (place.fileName === this.textSelected) arr.push(place)
		})

		if (arr.length > 0) {
			this.dateSelected = arr[0].fileDate
		}

		// Récupérer l'occurence de chaque lieu
		this.fs.getOccurence(arr, this.spacyList)

		this.initCoordsFileName(text)

		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(arr)
	}

	onSelectDate(date) {
		this.onFirsteCenter = false
		this.onCenter = false
		this.dateSelected = date
		let arr = []

		this.allNotDuplicatedCities.filter(place => {
			if (place.fileDate === this.dateSelected) arr.push(place)
		})

		if (arr.length > 0) {
			this.textSelected = arr[0].fileName
		}

		// Récupérer l'occurence de chaque lieu
		this.fs.getOccurence(arr, this.spacyList)

		this.initCoordsFileDate(date)
		if (this.clusters) this.clusters.clearLayers()
		this.getMarkers(arr)
	}

	onSelectALl() {
		this.onFirsteCenter = true
		this.onCenter = false
		this.onAllFiles = false
		this.textSelected = ''
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
		let groupeArr = this.fs.groupBy(arr, item => item.city)
		// {city,country,departement,fileDate,fileName,label,lat,lng,occurence}


		let newArr = []
		for (let key of groupeArr) {
			newArr.push({
				city: key[0],
				country: key[1][0].country,
				departement: key[1][0].departement,
				fileDate: key[1][0].fileDate,
				fileName: key[1][0].fileName,
				label: key[1][0].label,
				lat: key[1][0].lat,
				lng: key[1][0].lng,
				occurence: key[1][0].occurence,
			})
		}
		newArr.map(location => {
			let fileDate = ''
			let fileName = ''
			if (location.fileDate) fileDate = location.fileDate
			if (location.fileName) fileName = location.fileName
			this.marker = L.marker([location.lat, location.lng],
				{
					icon: new L.Icon(
						{
							iconUrl: 'assets/icons/circle_blue.png',
							iconSize: [15 + location.occurence, 15 + location.occurence],
							iconAnchor: [6, 10],
							popupAnchor: [5, -10],
						}
					),
				}
			)

			this.marker.bindPopup(`<center><span>${location.city}</span><span> - </span><span>${location.country}</span> <br> <span>Occurrence: ${location.occurence}</span> <br> <span>${fileName} </span> <br> <span>${fileDate} </span>`)
			this.marker.on('mouseover', function(){
				this.openPopup()
			})
			this.marker.on('mouseout', function(){
				this.closePopup()
			})
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
















