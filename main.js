import { json, csv } from 'd3-fetch'
import { select, selectAll, event } from 'd3-selection'
import * as topojson from 'topojson-client'
import { 
	geoPath, 
	geoMercator as theProjection, 
	geoGraticule
} from 'd3-geo'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'
import { timeParse, timeFormat } from 'd3-time-format'
import { timeMonth } from 'd3-time'

const width = 700
const height = width

const vancouver = [-123,49]

var lambda = -vancouver[0] // yaw
var phi = -vancouver[1] // pitch
var gamma = 0 // roll
var zoomFactor = 1

var pathGen, prj, places, investments, firstMonth

const parseDate = timeParse('%Y-%m')
const year = timeFormat('%Y')

updateProjection()

window.onload = async function(){
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
	
	await csv('data/places.csv').then( data => {
		places = data.filter( p => p.lon != '' )
		places.map( p => {
			p.location = [ Number(p.lon), Number(p.lat) ]
			delete p.lat;
			delete p.lon;
		} )
	} )
	
	await csv('data/investments.csv').then( data => {
		investments = data 
		investments.map( i => {
			i.Date = parseDate(i.Date)
			i.source = places.find( p => p.uid == i.source_uid )
			i.dest = places.find( p => p.uid == i.dest_uid )
			delete i.source_uid;
			delete i.dest_uid;
			i.arc = {
				'type':'LineString',
				'coordinates':[i.source.location,i.dest.location]}
		} )
	} )
	
	firstMonth = new Date( Math.min(...investments.map(i=>i.Date)) )
	let lastMonth = new Date( Math.max(...investments.map(i=>i.Date)) )
	// configure the time slider	
	select('#time-slider')
		.attr('max',timeMonth.count( firstMonth, lastMonth ) )
		.on('input',timeSlid)
	select('#year').text(year(firstMonth))
	updateTime(firstMonth)
}

function updateTime(thisDate){
	// find investments made within 3 months of selected date
	let investmentsNow = investments
		.filter( i => Math.abs(timeMonth.count(thisDate,i.Date)) <= 3 )
	// find the places associated with those investments 
	let placesNow = new Set()
	investmentsNow.map( i => {
		placesNow.add(i.dest) 
		placesNow.add(i.source)
	} )
	// update places on the map
	select('g#cities')
		.selectAll('circle')
		.data( [...placesNow], p=>p.uid )
		.join( enterCity, undefined, exitCity )
	// update investments
	select('g#investments')
		.selectAll('path')
		.data(investmentsNow,i=>i.uid)
		.join( enterInvestment, undefined, exitInvestment )
}

function enterCity(enterSelection){
	enterSelection.append('circle')
		.attr('cx',d => prj(d.location)[0] )
		.attr('cy',d => prj(d.location)[1] )
		.style('fill','none')
		.style('stroke','black')
		.attr('r',0)
		.transition()
		.attr('r',d=>2+Math.random()*10)
}

function exitCity(exitSelection){
	exitSelection.transition().attr('r',0).remove()
}

function enterInvestment( enterSelection ){
	enterSelection
		.append('path')
		.attr('d', investment => pathGen(investment.arc) )
}

function exitInvestment( exitSelection ){
	exitSelection
		.transition().duration(250) // fade out
		.style('opacity',0) 
		.remove()
}

function timeSlid(){
	let selectedDate = timeMonth.offset( firstMonth, this.value )
	select('#year').text(year(selectedDate))
	updateTime(selectedDate)
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
	prj = theProjection()
		.scale( width / 2 * zoomFactor )
		.translate( [ width/2, height/2 ] )
		.rotate( [ lambda, phi, gamma ] )
	pathGen = geoPath().projection( prj )
	// update geometries
	selectAll('#graticules path, #countries path')
		.attr('d', pathGen )
	selectAll('#cities circle')
		.attr('cx',d => prj(d.location)[0] )
		.attr('cy',d => prj(d.location)[1] )
	selectAll('#investments path')
		.attr('d',investment => pathGen(investment.arc))
}
