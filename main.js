import { json, csv } from 'd3-fetch'
import { select, event } from 'd3-selection'
import * as topojson from 'topojson-client'
import { 
	geoPath, 
	geoOrthographic as theProjection, 
	geoGraticule,
	geoInterpolate,
	geoCircle
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
	{ type:'LineString', coordinates:[ tokyo, sydney ] },
	{ type:'LineString', coordinates:[ sydney, vancouver ] },
	{ type:'LineString', coordinates:[ vancouver, toronto ] }
]

var lambda = -vancouver[0] // yaw
var phi = -vancouver[1] // pitch
var gamma = 0 // roll
var zoomFactor = 1

var pathGen

updateProjection()

const circleGen = geoCircle().radius(0.5)

window.onload = function(){
	// init SVG
	const svg = select('svg#map')
		.call( drag()
			.on('start',setNewDragReference)
			.on('drag',updateDrag)
		)
		.call( zoom()
			.scaleExtent([1,2])
			.on('zoom',zoomed)
		)
	json('data/countries.topojson').then( tjson => {
		let countries = topojson.feature(tjson,'countries')
		select('g#countries')
			.selectAll('path')
			.data(countries.features)
			.join('path')
			.attr('d', pathGen )
			.attr('id', d => d.properties.ISO_A3 )
			.attr('class','country')
			.append('title')
			.text( d => d.properties.NAME )
	} )
	select('g#graticules')
		.selectAll('path')
		.data( geoGraticule().lines() )
		.join('path')
		.attr('d', pathGen )
	csv('data/sample-data.csv').then( investments => {			
		select('g#investments')
			.selectAll('g')
			.data(investments.filter(d=>d.year==2019))
			.join('g')
			.call( g => {
				g.append('path')
					.datum(d=>circleGen.center([d.source_lon,d.source_lat])())
					.classed('source',true)
					.attr('d', pathGen )
				g.append('path')
					.datum(d=>circleGen.center([d.dest_lon,d.dest_lat])())
					.classed('dest',true)
					.attr('d', pathGen )
				g.append('path')
					.datum(d => {
						return {
							type:'LineString', 
							coordinates:[ 
								[d.source_lon,d.source_lat],
								[d.dest_lon,d.dest_lat]
							]
						}
					})
					.classed('arc',true)
					.attr('d', pathGen )
			} )
			
	} )
}

// initial drag positions
var initPos = {x:null,y:null}

function setNewDragReference(d){
	[ initPos.x, initPos.y ] = [ event.x, event.y ]
}

function updateDrag(d){
	// rotation about the poles is unlimited
	lambda += ( event.x - initPos.x ) / 8 / zoomFactor
	// vertical rotation limited to ( -90, 90 )
	phi = Math.min(
		90,
		Math.max(
			-90,
			phi - ( event.y - initPos.y ) / 8 / zoomFactor
		)
	)
	setNewDragReference()
	updateProjection()
}

function zoomed(){
	zoomFactor = event.transform.k
	updateProjection()
}

function updateProjection(){
	// set the projection from configured variables
	let prj = theProjection()
		.scale( width / 2 * zoomFactor )
		.translate( [ width/2, height/2 ] )
		.rotate( [ lambda, phi, gamma ] )
	pathGen = geoPath().projection( prj )
	select('#projected-map-elements')
		.selectAll('path')
		.attr('d', pathGen )
}
