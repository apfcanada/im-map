import { json } from 'd3-fetch'
import { select } from 'd3-selection'
import * as topojson from 'topojson-client'
import { geoPath, geoOrthographic, geoGraticule } from 'd3-geo'

const width = 700
const height = width

const toronto = [-79,43]
const tokyo = [134,35]
const vancouver = [-123,49]
const sydney = [149,-33]

const arcs = [ 
	{ type:'LineString', coordinates:[toronto,tokyo] },
	{ type:'LineString', coordinates:[toronto,vancouver] },
	{ type:'LineString', coordinates:[vancouver,tokyo] },
	{ type:'LineString', coordinates:[vancouver,sydney] },
	{ type:'LineString', coordinates:[toronto,sydney] }
]

const prj = geoOrthographic()
	.rotate( toronto.map(c=>-c) )
	.scale( width/2 )
	.translate( [ width/2, height/2 ] )
const pathGen = geoPath().projection( prj )
const graticule = geoGraticule()

window.onload = function(){

	const svg = select('svg#map')
		.attr('width',width)
		.attr('height',height)

	const graticuleGroup = svg.append('g').attr('id','graticules')
	const countryGroup = svg.append('g').attr('id','countries')
	const arcGroup = svg.append('g').attr('id','arcs')

	json('data/countries.topojson').then( tjson => {
		let countries = topojson.feature(tjson,'countries')
		graticuleGroup
			.selectAll('path')
			.data( graticule.lines() )
			.join('path')
			.attr('d', pathGen )
		countryGroup
			.selectAll('path')
			.data(countries.features)
			.join('path')
			.attr('d', pathGen )
			.attr('id', d => d.properties.ISO_A3 )
			.attr('class','country')
			.append('title')
			.text( d => d.properties.NAME )
		arcGroup
			.selectAll('path')
			.data( arcs )
			.join('path')
			.attr('d', pathGen )
	} )
}
