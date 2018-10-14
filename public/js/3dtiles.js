function init () {
	// 展示地图
	showMap();
	getList();
	addEvent();
}

function addEvent () {
	$(".clear-tiles").click(function () {
		viewer.scene.primitives.removeAll();	
	})

	$(".popup .close").click(function(event) {
		$(".popup").hide();
		$("#list ul li").removeClass('active');
	});
}


function showMap () {
	viewer = new Cesium.Viewer('right',{
		  // imageryProvider : new Cesium.WebMapTileServiceImageryProvider({
		  //                               url : '/QuadServer/services/maps/wmts100',
		  //                               layer : 'world_image',
		  //                               style : 'default',
		  //                               format : 'image/jpeg',
		  //                               tileMatrixSetID : 'PGIS_TILE_STORE',
		  //                               // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
		  //                               minimumLevel: 0,
		  //                               maximumLevel: 19,
		  //                               credit : new Cesium.Credit('world_country'),
		  //                               tilingScheme : new Cesium.GeographicTilingScheme({rectangle : extent})
		  //                     })
	});
	viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
}

function getList () {
	$.ajax({
		url: '/getList',
		type: 'get',
		dataType: 'text',
	})
	.done(function(result) {
		// console.log("success");
		var json = JSON.parse(result);
		console.log(json);
		showList(json);
    
	})
	.fail(function() {
		console.log("error");
	})
	.always(function() {
		console.log("complete");
	});
	
}

function showList (json) {
	var error = json["error"];
	if(error){
		console.log(error);
		alert("暂时无法获取列表");
		return;
	}

	var list = json["list"];
	if(!list){
		return;
	}
	var html = `<ul>`;
	list.forEach( function(item, index) {
		var uuid = item.uuid;
		var output = item.output;
		var ifc = item.ifc;
		var date = item.time;
		date = formatDate(new Date(date));
		if(output){
			html += `<li uuid='${uuid}'>
			<div class='ifc-name'>${ifc}</div>
			<div class='ifc-time'>${date}</div>
			<div class='ifc-tool'><button>显示</button></div>
			<div class='clear'></div>
			</li>`;
		}else{
			html += `<li uuid='${uuid}'>
				<div class='ifc-name'>${ifc}</div>
				<div class='ifc-tool'><button disabled>显示</button></div>
				<div class='clear'></div>
				</li>`;
		}
		
	});
	
	html += `</ul>`;

	$("#left #list").html(html);

	$("#list .ifc-tool button").click(function (e) {
		e.preventDefault();
		var uuid = $(this).parents("li").attr("uuid");
		show3dtiles(uuid);
		return false;
	})

	$("#list li").click(function (e) {

		$(".popup").hide();

		if($(this).hasClass('active')){
			$(this).removeClass('active');
			return;
		}
		$("#list ul li").removeClass('active');
		$(this).addClass('active');
		var uuid = $(this).attr("uuid");
		getInfo(uuid);
	})
	
}


function show3dtiles (uuid) {
	viewer.scene.primitives.removeAll();
	tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
      url : "public/data/output/" + uuid + "/tiles",
	}));
	tileset.readyPromise.then(function(tileset) {
	    viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
	     viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
	})

}

function formatDate (date) {
	if(!date){
		return;
	}
	var yyyy = date.getFullYear().toString();
	var MM = (date.getMonth() + 1).toString();;
	var dd = date.getDate().toString();
	var hh = date.getHours().toString();
	var mm = date.getMinutes().toString();
	var ss = date.getSeconds().toString();
	 var result =  yyyy + '-' + (MM[1]?MM:"0"+MM[0]) 
	 + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + (hh[1]?hh:"0"+hh[0]) 
	 + ':' + (mm[1]?mm:"0"+mm[0]) + ':' + (ss[1]?ss:"0"+ss[0]);
	 return result;
}

function getInfo (uuid) {
	$.ajax({
		url:`/getInfo/${uuid}`,
		type: 'get',
		dataType: 'text',
	})
	.done(function(result) {
		console.log(result);
		var json = JSON.parse(result);
		showInfo(json);
	})
	.fail(function() {
		console.log("error");
	})
	.always(function() {
	});
	
}

function showInfo (json) {
	if(json["error"]){
		console.log(json);
		alert("无法获取信息");
		return;
	}
	var uuid = json["uuid"];
	if(!uuid){
		return;
	}
	var type = json.type;
	var count0 = json.count0;
	var countX = json.countX;
	var countY = json.countY;
	var countZ = json.countZ;
	var lon = json.lon;
	var lat = json.lat;
	var box = json.box;

	var item = $(`#list li[uuid=${uuid}]`);

	if(item.length == 0){
		return;
	}
	var liElement = item[0];
	var offsetTop = liElement.offsetTop;
	// $("#list ul li").removeClass('active');
	// item.addClass('active');



	var item = $(`#list li[uuid='${uuid}']`);
	var html = `<div >
					<div class='item'>
						<span class='info-item'>uuid:</span>
						<span class='info-name'>${uuid}</span>
					</div>
					<div class='item'>
						<span class='info-item'>类型:</span>
						<span class='info-name'>${getIfcType(type) }</span>
					</div>
					<div class='item'>
						<span class='info-item'>中心点:</span>
						<span class='info-name'>
							<span class='info-item'>经度:</span>
							<span class='info-name'>${(lon)?lon:""}</span>
						</span>
					</div>
					<div class='item'>
						<span class='info-item'></span>
						<span class='info-name'>
							<span class='info-item'>纬度:</span>
							<span class='info-name'>${lat?lat:""}</span>
						</span>
					</div>
					<div class='item'>
						<span class='info-item'>切分:</span>
						<span class='info-name'>
							<span class='info-item'>0级:</span>
							<span class='info-name'>${count0}</span>
							<span class='info-item'>X向:</span>
							<span class='info-name'>${countX}</span>
						</span>
					</div>
					<div class='item'>
						<span class='info-item'></span>
						<span class='info-name'>
							<span class='info-item'>Y向:</span>
							<span class='info-name'>${countY}</span>
							<span class='info-item'>Z向:</span>
							<span class='info-name'>${countZ}</span>
						</span>
					</div>
					${getBoxInfo(box)}

				</div>`;

	$(".popup .main").html(html);
	$(".popup").css("top",offsetTop + "px").show();
}


function getIfcType (type) {
	var result = null;
	switch (type) {
		case "wlm":
			result = "外立面";
			break;
		case "tujian":
			result = "土建";
			break;
		case "neizhuangshi":
			result = "内装饰";
			break;
		case "shuinuan":
			result = "水暖";
			break;
		default:
			result = "通用"
			break;
	}
	return result;
}

function getBoxInfo (box) {
	if(!box){
		return;
	}

	var lon = box.max_lon - box.min_lon;
	var lat = box.max_lat - box.min_lat;
	var height = box.max_height - box.min_height;

	return `<div class='item'>
				<span class='info-item'>范围:</span>
				<span class='info-name'>
					<span class='info-item'>X向:</span>
					<span class='info-name'>${lon?lon.toFixed(2):""}</span>
					<span class='info-item'>Y向:</span>
					<span class='info-name'>${lat?lat.toFixed(2):""}</span>
					<span class='info-item'>Z向:</span>
					<span class='info-name'>${height?height.toFixed(2):""}</span>
				</span>
			</div>`;
}