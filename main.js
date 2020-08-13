import { map, tileLayer, LatLng } from 'leaflet'
import { GeodesicLine } from 'leaflet.geodesic'
import { csv } from 'd3-fetch'


const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'

const basemapStyle = 'apfcanada/ckcxiyprg0wwf1kqrmu48n937'

const publicToken = 'pk.eyJ1IjoiYXBmY2FuYWRhIiwiYSI6ImNrY3hpdzcwbzAwZzIydms3NGRtZzY2eXIifQ.E7PbT0YGmjJjLiLmyRWSuw'

var theMap

window.onload = function () {
	theMap = map('map').setView([43.7,-79.5],3)
	
	tileLayer(
		'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
		{
			'attribution': attribution,
			'maxZoom': 18,
			'id': basemapStyle,
			'tileSize': 512,
			'zoomOffset': -1,
			'accessToken': publicToken
		}
	).addTo(theMap)

	addSampleData()
}

function addSampleData(){
	csv('./data/sample.csv').then( data => {
		data.map( d => {
			let orig = new LatLng(d.lat_from,d.lon_from)
			let dest = new LatLng(d.lat_to,d.lon_to)
			d.vector = new GeodesicLine(
				[orig,dest], 
				{ color: 'white', weight: 1, steps: 5, wrap: false }
			).addTo(theMap)
		} )
		console.log( data )
	} )
}
