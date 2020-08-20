import { json } from 'd3-fetch'
import { select } from 'd3-selection'
import * as topojson from 'topojson-client'
import { geoPath, geoConicEquidistant } from 'd3-geo'

const width = 1000
const height = 600

const prj = geoConicEquidistant()
const pathGen = geoPath().projection( prj )

window.onload = function(){
	const svg = select('svg#map')
		.attr('width',width)
		.attr('height',height)

	json('data/countries.topojson').then( tjson => {
		console.log(tjson)
		let countries = topojson.feature(tjson,'countries')
		console.log(countries)
		svg.selectAll('path')
			.data(countries.features)
			.join('path')
			.attr('d', d => pathGen(d) )
			.attr('id', d => d.properties.ISO_A3 )
			.attr('class','country')
			.append('title')
			.text( d => d.properties.NAME )
	} )
}
