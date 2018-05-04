'use strict';

console.log("HI");
var myView = document.getElementById('pixi');
var app = new PIXI.Application(400, 400, {backgroundColor : 0x1099bb, view: myView});
var renderer = PIXI.autoDetectRenderer(400, 400, myView);
//document.body.appendChild(app.view);

var area_data = "";

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

var placeables = [];

function initStoredAreaManipulation() {
    myView = document.getElementById('pixi');
    app = new PIXI.Application(400, 400, {backgroundColor : 0x1099bb, view: myView});
    renderer = PIXI.autoDetectRenderer(400, 400, myView);

    fetch(config.api_url + 'area')
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {
        console.log(myJson[0].data);
        var data = myJson[0].data;
        area_data = data;
        while (data.indexOf("COMP_P") > -1)
        {
            data = data.substring(data.indexOf("COMP_P")+7);
            //data = data.substring(nth_occurrence(data, "@", 4));
            var pos_data = data.substring(nth_occurrence(data, "@", 3)+2);
            var x = pos_data.substring(0, nth_occurrence(pos_data, ";", 1));
            var y = pos_data.substring(nth_occurrence(pos_data, ";", 1)+1, nth_occurrence(pos_data, ";", 2));
            var z = pos_data.substring(nth_occurrence(pos_data, ";", 2)+1, nth_occurrence(pos_data, ";", 3));
            var rot = pos_data.substring(nth_occurrence(pos_data, ";", 3)+1, nth_occurrence(pos_data, ";", 4));
            createPlaceable(parseInt(x)/10.0, renderer.height - parseInt(y)/10.0, Math.radians(parseFloat(rot)))
        }
      });
}

function createPlaceable(x, y, rot) {

    var placeable = new PIXI.Graphics();
    // Draw a pretty triangle
    placeable.beginFill(0x000000);
    placeable.moveTo(0, -2);
    placeable.lineTo(-2, 2);
    placeable.lineTo(2, 2);
    placeable.lineTo(0, -2);
    placeable.endFill();

    placeable.interactive = true;

    // This button mode will mean the hand cursor appears when you roll over the placeable with your mouse
    placeable.buttonMode = true;

    placeable.scale.set(3);

    // Setup events for mouse + touch using the pointer events
    placeable
        .on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    // Move the placeable to its designated position
    placeable.x = x;
    placeable.y = y;
    placeable.rotation = rot;

    // Add it to the stage
    app.stage.addChild(placeable);

    // Store the placeable to the placeable array
    placeables.push(placeable);
}

var dragged = null;

function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
    // Save a reference to the object to a global 'dragged' variable
    // which we can access in  keyboard etc events.
    dragged = this;
}

function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    this.data = null;
    dragged = null;
}

function onDragMove() {
    if (this.dragging) {
        var newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
    }
}

document.addEventListener("mousewheel", mouseWheelHandler, false);
// Hack for Firefox
document.addEventListener("DOMMouseScroll", mouseWheelHandler, false);

function mouseWheelHandler(e) {
    console.log("Mouse wheel");

    // Check that we're dragging something
    if (dragged) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        console.log("Delta: " + delta);
        dragged.rotation += delta*0.1;
    }
    
    // Disable mouse scrolling of the page while the cursor is over the tool canvas.
    if(e.preventDefault) { e.preventDefault(); } /* Chrome, Safari, Firefox */
    e.returnValue = false; /* IE7, IE8 */
}

function nth_occurrence (string, char, nth) {
    var first_index = string.indexOf(char);
    var length_up_to_first_index = first_index + 1;

    if (nth == 1) {
        return first_index;
    } else {
        var string_after_first_occurrence = string.slice(length_up_to_first_index);
        var next_occurrence = nth_occurrence(string_after_first_occurrence, char, nth - 1);

        if (next_occurrence === -1) {
            return -1;
        } else {
            return length_up_to_first_index + next_occurrence;  
        }
    }
}

function send_area()
{
    console.log("Sending area");
    var to_send = "";
    var area_data_copy = area_data;
    to_send += area_data.substring(0, area_data.indexOf("COMP_P")+7);
    var placeable_i = 0;
    while (area_data.indexOf("COMP_P") > -1)
    {
        var placeable = placeables[placeable_i];
        if (placeable_i > 0)
            to_send += "COMP_P@";
        area_data = area_data.substring(area_data.indexOf("COMP_P")+7);
        var pos_data = area_data.substring(nth_occurrence(area_data, "@", 3)+2);
        to_send += area_data.substring(0, nth_occurrence(area_data, "@", 3)+2);

        var x = pos_data.substring(0, nth_occurrence(pos_data, ";", 1));
        to_send += Math.round(placeable.x * 10).toString() + ";";

        var y = pos_data.substring(nth_occurrence(pos_data, ";", 1)+1, nth_occurrence(pos_data, ";", 2));
        console.log("y: " + placeable.y + " parsed: " + (renderer.height - parseInt(y)/10.0) + " before parsing: " + y);
        console.log("With calc: " + ((renderer.height - placeable.y) * 10.0))
        to_send += ((renderer.height - placeable.y) * 10.0) + ";";

        var z = pos_data.substring(nth_occurrence(pos_data, ";", 2)+1, nth_occurrence(pos_data, ";", 3));
        to_send += z + ";";

        var rot = pos_data.substring(nth_occurrence(pos_data, ";", 3)+1, nth_occurrence(pos_data, ";", 4));
        to_send += Math.round(Math.degrees(placeable.rotation)).toString() + ";";

        placeable_i++;
    }
    area_data = area_data_copy;
    console.log("To Send: " + to_send);

      fetch(config.api_url + 'area', {
        method: 'post',
        body: to_send
      }).then(function(response) {
        console.log("Post response: " + response);
      }).then(function(data) {
        console.log('Post error: ', data);
      });
}
