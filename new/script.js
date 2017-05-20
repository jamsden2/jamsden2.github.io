//user settings
var user = {
	position: new google.maps.LatLng(45,45),
	lastReloadPosition: new google.maps.LatLng(0,0),
	autoZoom: true,
	autoPan: true,
	zoomThreshold: 19,
	zoomIs: 0,
	zoomWas: 0,
	bufferSizeFactor: 2,
	viewPortSizeFactor: 1.5,
	distanceToReloadFactor: 1,
	bearing: 0,
	//for bounds of data load	
	ringArray: function(diameterFactor) {
		var ringRadius = google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), map.getBounds().getNorthEast()) * diameterFactor;
		var polygonArray = [];
		for (i = 0; i < 360; i = i + 30) {
			var pointCoords = [];
			pointCoords.push(google.maps.geometry.spherical.computeOffset(map.getCenter(), ringRadius, i).lng());
			pointCoords.push(google.maps.geometry.spherical.computeOffset(map.getCenter(), ringRadius, i).lat());
			polygonArray.push(pointCoords);
		};
		return polygonArray;
	},
	geoGeometry: function(type) {
		var geoQueryObject = {
			rings: [],
			spatialReference: {
				wkid: 4326
			}
		};
		if (type == "full") {
			geoQueryObject.rings.push(user.ringArray(user.bufferSizeFactor));
		} else if (type == "viewport") {
			geoQueryObject.rings.push(user.ringArray(user.viewPortSizeFactor));
		} else if (type == "buffer") {
			geoQueryObject.rings.push(user.ringArray(user.viewPortSizeFactor));
			geoQueryObject.rings.push(user.ringArray(user.bufferSizeFactor));
		};
		return geoQueryObject;
		},	
};



//create the map
var map = new google.maps.Map(document.getElementById('map'),{
	center: user.position,
	zoom: 12
});














//create object for data services
var trees = {
	commonNameOptions: ["COM_NAME", "COMMON_NAME", "SPECIES_NAME"],
	//array of local geojson tree inventory services, split so that I can easily insert the polygon array
	availableServices: [
	["https://services.arcgis.com/ZpeBVw5o1kjit7LT/arcgis/rest/services/StreetTrees/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=", "&geometryType=esriGeometryPolygon&inSR=&spatialRel=esriSpatialRelContains&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pgeojson&token="],
	["https://services1.arcgis.com/qAo1OsXi67t7XgmS/arcgis/rest/services/Tree_Inventory/FeatureServer/0/query?where=STATUS%3D%27ACTIVE%27&objectIds=&time=&geometry=", "&geometryType=esriGeometryPolygon&inSR=4326&spatialRel=esriSpatialRelContains&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&quantizationParameters=&sqlFormat=none&f=pgeojson&token="],
	["https://maps.cambridge.ca/arcgispub/rest/services/OpenData/MapServer/7/query?where=1%3D1&text=&objectIds=&time=&geometry=", "&geometryType=esriGeometryPolygon&inSR=&spatialRel=esriSpatialRelContains&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&f=geojson"]],
	results: [],
	getData: function(type) {
		for (var i = 0; i < this.availableServices.length; i++) {
			//insert polygon geometry into service request
			var requestURL = this.availableServices[i][0] + encodeURIComponent(JSON.stringify(user.geoGeometry(type))) + this.availableServices[i][1]
			//execute loadGeoJson
			map.data.loadGeoJson(requestURL, null, trees.fillResults());
		}
	},
	
	
	
	
	
		
	clear: function() {
		map.data.forEach(function(feature) {
			map.data.remove(feature);
		});
	},
	cleanup: function() {
		map.data.forEach(function(feature) {
			if (google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), feature.getGeometry().get()) > google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), map.getBounds().getNorthEast()) * user.bufferSizeFactor) {
			map.data.remove(feature);
			};
			});
	},
	fillResults: function() {
		trees.results = [];
		map.data.forEach(function(feature){
			if (google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), feature.getGeometry().get()) < google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), map.getBounds().getNorthEast())) {
				var treeObject = {
					name: "tree name",
					coordinates: {},
					distanceToUser: 9999999
					};
				var treeNormalizedName = "Unknown";
				for (var i = 0; i < trees.commonNameOptions.length; i++){
					var treeName = feature.getProperty(trees.commonNameOptions[i]); 
					if (treeName) {
						treeObject.name = treeName;
						};
					};	
				treeObject.coordinates = feature.getGeometry().get();
				treeObject.distanceToUser = google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), treeObject.coordinates);
				treeObject.headingFromUser = google.maps.geometry.spherical.computeHeading(map.getCenter(), treeObject.coordinates);
				trees.results.push(treeObject);
				};
			});
		trees.results.sort(function(a,b) {
			return parseFloat(a.distanceToUser) - parseFloat(b.distanceToUser);
			});
			console.log(trees.results);
	},
	returnResults: function() {
		return trees.results;
	}
}









/* function createTable(tableData,divId) {
  var table = document.createElement('table');
  var tableBody = document.createElement('tbody');

  tableData.forEach(function(rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      var cell = document.createElement('td');
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);
  document.getElementById(divId).appendChild(table);
} */




function createTable(tableData,divId) {
	var table = document.createElement('table');
	var tableHead = document.createElement('thead');
	var tableHeadRow = document.createElement('tr');
	var tableHeadFirstColumn = document.createElement('th');
	tableHeadFirstColumn.appendChild(document.createTextNode("Species"));
	var tableHeadSecondColumn = document.createElement('th');
	tableHeadSecondColumn.appendChild(document.createTextNode("Distance"));
	var tableHeadThirdColumn = document.createElement('th');
	tableHeadThirdColumn.appendChild(document.createTextNode("Heading"));
	var tableBody = document.createElement('tbody');

  tableData.forEach(function(rowData) {
    var row = document.createElement('tr');

    var nameCell = document.createElement('td');
      nameCell.appendChild(document.createTextNode(rowData.name));
      row.appendChild(nameCell);
	 
	var distanceCell = document.createElement('td');
      distanceCell.appendChild(document.createTextNode(Math.round(rowData.distanceToUser) + "m"));
      row.appendChild(distanceCell);
	  
	
	var headingCell = document.createElement('td');
	headingCell.appendChild(document.createTextNode(Math.round(rowData.headingFromUser) + "\xB0"));
	row.appendChild(headingCell);
   

    tableBody.appendChild(row);
  });
	tableHeadRow.appendChild(tableHeadFirstColumn);
	tableHeadRow.appendChild(tableHeadSecondColumn);
	tableHeadRow.appendChild(tableHeadThirdColumn);
	tableHead.appendChild(tableHeadRow);
	table.appendChild(tableHead);
	
  table.appendChild(tableBody);
  document.getElementById(divId).innerHTML = '';
  document.getElementById(divId).appendChild(table);
}







//create the user marker
/* var locationMarker = new google.maps.Circle({
		strokeColor: '#FF0000',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#FF0000',
		fillOpacity: 0.1,
		map: map,
		center: user.position,
		radius: 30
	}); */

var locationCenter = new google.maps.Circle({
		strokeColor: "black",
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: "black",
		fillOpacity: 0.1,
		map: map,
		center: user.position,
		radius: 5
	});

var locationMarker = new google.maps.Marker({
          position: map.getCenter(),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
			fillColor: "DodgerBlue",
			fillOpacity: 1,
            scale: 10,
			strokeWeight: 5,
			strokeColor: "White",
			strokeOpacity: .3
			
          },
          draggable: false,
          map: map
        });
		
var bearingMarker = new google.maps.Marker({
          position: map.getCenter(),
          icon: {
            path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW,
			scale: 10,
			strokeWeight: 5,
			strokeColor: "DodgerBlue",
			strokeOpacity: .3,
			rotation: 0
			
          },
          draggable: false,
          map: map
        });


	
	
	
	
	
	





//geolocation - this acts as a listener in a sense
var geoOptions = {
  enableHighAccuracy: true, 
  maximumAge        : 10000, 
  timeout           : 30000
};
function geoError() {
  alert("It seems that I can't get a lock on your location. Walk around a bit and I should be able to pick it up.");
};
function geoSuccess(position) {
	user.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	if (user.autoPan) {	
		map.panTo(user.position);
	};
	if (user.autoZoom) {
		map.setZoom(21);
	};
	user.bearing = position.coords.bearing;
};














//start the watcher	
var geoLocator = navigator.geolocation.watchPosition(geoSuccess,geoError,geoOptions);

//start listeners

map.addListener('drag', function(){
	bearingMarker.setPosition(map.getCenter());
	bearingMarker.rotation = user.bearing;
	locationMarker.setPosition(map.getCenter());
	locationCenter.setCenter(map.getCenter());
	
});


map.addListener('idle', function() {
	//trees.getData2(trees.getData2);
	bearingMarker.setPosition(map.getCenter());
	bearingMarker.rotation = user.bearing;
	locationMarker.setPosition(map.getCenter());
	locationCenter.setCenter(map.getCenter());
	console.log("Zoom:", map.getZoom());
	if (map.getZoom() < user.zoomThreshold) {
		trees.clear();
	} else {
		trees.cleanup();
		var distanceLastReload = google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), user.lastReloadPosition);
		console.log(distanceLastReload);
		if (distanceLastReload < google.maps.geometry.spherical.computeDistanceBetween(map.getCenter(), map.getBounds().getNorthEast()) * user.distanceToReloadFactor) {
			trees.getData("buffer");
			user.lastReloadPosition = map.getCenter();
			trees.returnResults;
		} else {
			trees.getData("full");
			user.lastReloadPosition = map.getCenter();
			trees.returnResults;
			//createTable([["row 1, cell 1", "row 1, cell 2"], ["row 2, cell 1", "row 2, cell 2"]],"results");
			
		};
	}
	createTable(trees.results,"results");
});

map.addListener('zoom_changed', function() {
	if (map.getZoom() >= user.zoomThreshold) {
		trees.getData("viewport");
	};
});

















































