import { json } from 'd3-fetch'
import { select, event } from 'd3-selection'
import * as topojson from 'topojson-client'
import { 
	geoPath, 
	geoOrthographic, 
	geoGraticule
} from 'd3-geo'
import { drag } from 'd3-drag'

const width = 700
const height = width

const toronto = [-79,43]
const tokyo = [134,35]
const vancouver = [-123,49]
const sydney = [149,-33]

const arcs = [ 
	{ type:'LineString', coordinates:[ toronto, tokyo ] },
	{ type:'LineString', coordinates:[ vancouver, tokyo ] },
	{ type:'LineString', coordinates:[ vancouver, sydney ] },
	{ type:'LineString', coordinates:[ toronto, sydney ] }
]

var lambda = -toronto[0]
var phi = -toronto[1]
var gamma = 0

var prj = geoOrthographic()
	.scale( width/2 )
	.translate( [ width/2, height/2 ] )
	.rotate( [ lambda, phi, gamma ] )
const pathGen = geoPath().projection( prj )

var graticuleGroup, countryGroup, arcGroup 

window.onload = function(){
	// init SVG
	const svg = select('svg#map')
		.attr('width',width)
		.attr('height',height)
		.call( drag()
			.on('start',startDrag)
			.on('end',endDrag)
		)
	graticuleGroup = svg.append('g').attr('id','graticules')
	countryGroup = svg.append('g').attr('id','countries')
	arcGroup = svg.append('g').attr('id','arcs')
	json('data/countries.topojson').then( tjson => {
		let countries = topojson.feature(tjson,'countries')
		countryGroup
			.selectAll('path')
			.data(countries.features)
			.join('path')
			.attr('d', pathGen )
			.attr('id', d => d.properties.ISO_A3 )
			.attr('class','country')
			.append('title')
			.text( d => d.properties.NAME )
	} )
	graticuleGroup
		.selectAll('path')
		.data( geoGraticule().lines() )
		.join('path')
		.attr('d', pathGen )
	arcGroup
		.selectAll('path')
		.data( arcs )
		.join('path')
		.attr('d', pathGen )
}

// initial drag positions
var initPos = {x:null,y:null}

function startDrag(d){
	initPos.x = event.x
	initPos.y = event.y
}

function endDrag(d){
	let delta_x = event.x - initPos.x
	let delta_y = event.y - initPos.y
	console.log('ended drag',delta_x, delta_y)
	// update the projection
	lambda += delta_x / 5
	phi -= delta_y / 5
	prj = geoOrthographic()
		.scale( width/2 )
		.translate( [ width/2, height/2 ] )
		.rotate( [ lambda, phi, gamma ] )
	// redraw
	let pg = geoPath().projection( prj )
	graticuleGroup.selectAll('path').attr('d', pg )
	countryGroup.selectAll('path').attr('d', pg )
	arcGroup.selectAll('path').attr('d', pg )
}
