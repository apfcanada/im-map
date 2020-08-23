import { json } from 'd3-fetch'
import { select, event } from 'd3-selection'
import * as topojson from 'topojson-client'
import { 
	geoPath, 
	geoOrthographic as theProjection, 
	geoGraticule
} from 'd3-geo'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'

const width = 700
const height = width

const toronto = [-79,43]
const tokyo = [139,36]
const vancouver = [-123,49]
const sydney = [149,-33]

const arcs = [ 
	{ type:'LineString', coordinates:[ toronto, tokyo ] },
	{ type:'LineString', coordinates:[ vancouver, tokyo ] },
	{ type:'LineString', coordinates:[ vancouver, sydney ] },
	{ type:'LineString', coordinates:[ toronto, sydney ] }
]

var lambda = -vancouver[0]
var phi = -vancouver[1]
var gamma = 0
var zoomFactor = 1

var prj = theProjection()
	.scale( width * zoomFactor )
	.translate( [ width/2, height/2 ] )
	.rotate( [ lambda, phi, gamma ] )
var pathGen = geoPath().projection( prj )

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
		.call( zoom()
			.scaleExtent([0.5,2])
			.on('zoom',zoomed)
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
	// update the projection
	lambda += ( event.x - initPos.x ) / 8 / zoomFactor
	phi -= ( event.y - initPos.y ) / 8 / zoomFactor
	prj = theProjection()
		.scale( width * zoomFactor )
		.translate( [ width/2, height/2 ] )
		.rotate( [ lambda, phi, gamma ] )
	// redraw
	pathGen = geoPath().projection( prj )
	updateMap()
}

function zoomed(){
	zoomFactor = event.transform.k
	// update projection
	prj = theProjection()
		.scale( width * zoomFactor )
		.translate( [ width/2, height/2 ] )
		.rotate( [ lambda, phi, gamma ] )
	// and redraw
	pathGen = geoPath().projection( prj )
	updateMap()
}

function updateMap(){
	graticuleGroup.selectAll('path').attr('d', pathGen )
	countryGroup.selectAll('path').attr('d', pathGen )
	arcGroup.selectAll('path').attr('d', pathGen )
}
