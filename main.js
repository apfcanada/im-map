import { map, tileLayer } from 'leaflet'

const attribution = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'

const basemapStyle = 'apfcanada/ckcxiyprg0wwf1kqrmu48n937'

const publicToken = 'pk.eyJ1IjoiYXBmY2FuYWRhIiwiYSI6ImNrY3hpdzcwbzAwZzIydms3NGRtZzY2eXIifQ.E7PbT0YGmjJjLiLmyRWSuw'

window.onload = function () {
	var mymap = map('map').setView([43.7,-79.5],10)
	
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
	).addTo(mymap)

}
