import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DataService {

	routes:any = []
	constructor(private http:HttpClient) { 
	}

	getLocation(){
		return this.http.get(`${environment.url}/cities`)
	}

	getCountries(){		
		return this.http.get(`${environment.url}/countries`)
	}

	sendFile(form){
		const headers = new HttpHeaders({
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Methods': 'POST',
			'Access-Control-Allow-Origin': '*'
		})
		return this.http.post(`${environment.url_py}/file`,form)
	}

	getRiver(){
		return this.http.get('assets/data/river.json')
	}
}
