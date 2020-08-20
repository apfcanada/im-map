import { json } from 'd3-fetch'
import { select } from 'd3-selection'
//import * as topojson from 'topojson-client'
import { geoPath, geoMercator } from 'd3-geo'

const width = 800
const height = 800

const prj = geoMercator()
const pathGen = geoPath().projection( prj )

window.onload = function(){
	const svg = select('svg#map')
		.attr('width',width)
		.attr('height',height)

	json('data/countries.geojson').then( j => {
		console.log(j)
		svg.selectAll('path')
			.data(j.features)
			.join('path')
			.attr('d', d => pathGen(d) )
			.attr('class','country')
			.append('title')
			.text( d => d.properties.NAME )
	} )
}
