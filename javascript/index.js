
const $ = require("jquery");

const ImageUtil = require("./image-util.js");
const PaletteTableWriter = require("./palette-table-writer.js");
const HistogramPaletteBuilder = require("./histogram-palette-builder.js");
const HistogramPalettePlotter = require("./histogram-palette-plotter.js");
const MedianCutRunner = require("./median-cut-runner.js");
const MedianCutPlotter = require("./median-cut-plotter.js");

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
} else {
  alert('The File APIs are not fully supported in this browser.');
}

var image = null;
var timerId;
function handleFileSelect(evt) {
  var file = evt.target.files[0];

  console.log("file is " + file);

  var start = 0;
  var stop = file.size - 1;

  var reader = new FileReader();

  reader.onload = (function(theFile) {
    return function(e) {
      image = document.getElementById('original-image');
      image.src = e.target.result;

      $("#source-image").show();
      $("#plot-content").show();

      $(".input-image-panel").hide();
      $("#input-image-plot").hide();

      $("#histogram-output").hide();
      $("#median-cut-output").hide();
      $("#kmeans-output").hide();
    };
  })(file);

  $("#original-image").attr("src","");
  timerId = setInterval(showImageIfPossible, 1000);
  reader.readAsDataURL(file);
}

function showImageIfPossible() {
  var imageSrc = document.getElementById("original-image").src;
  if(!_.isEmpty(imageSrc)) {
    clearInterval(timerId);
    run();
    plotOriginalData(pixels);
  } else {
    console.log("tick");
  }
}

var pixels = null;
function run(){
  var imgWidth = image.width;
  var imgHeight = image.height;
  var maxDimension = imgWidth > imgHeight ? imgWidth : imgHeight;

  var scale = maxDimension / 100;
  var canvasHeight = parseInt(imgHeight / scale);
  var canvasWidth = parseInt(imgWidth / scale);

  var canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.getContext('2d').drawImage(image, 0, 0, canvasWidth, canvasHeight);

  console.log("Canvas size: " + canvas.width + "x" + canvas.height);
  var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
  console.log("pixel data: " + pixelData);

  pixels = [];
  for (var x=0; x < canvas.width; x++){
    for (var y=0; y < canvas.height; y++){
      var pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
      pixels.push({
        red: pixel[0],
        green: pixel[1],
        blue: pixel[2]
      });
    }
  }

  console.log("read image, found " + pixels.length + " pixels");
}

function plotImage() {
  plotOriginalData(pixels);
}

// ========================================================================================
// =================================== Entry Functions ====================================
// ========================================================================================
function resetAlgorithmOutputs(){
  removePaletteTable("#histogram-palette");
  $("#histogram-output").hide();

  removePaletteTable("#median-cut-palette");
  $("#median-cut-output").hide();

  removePaletteTable("#kmeans-palette");
  $("#kmeans-output").hide();
}

function runHistogram() {
  removePaletteTable("#histogram-palette");
  $("#histogram-output").hide();
  var histogramInputValue = parseInt($("#histogram-input").val());

  let histogramPaletteBuilder = new HistogramPaletteBuilder();
  bucketedPixelInfos = histogramPaletteBuilder.binPixels(pixels, histogramInputValue);

  let histogramPalettePlotter = new HistogramPalettePlotter();
  histogramPalettePlotter.plot("histogram-plot", pixels, bucketedPixelInfos.buckets, bucketedPixelInfos.colors, histogramInputValue);

  var bucketsInPalette = _.take(bucketedPixelInfos.buckets, 10);
  PaletteTableWriter.drawPaletteTable("#histogram-palette", bucketsInPalette);

  $("#histogram-output").show();
}

function runMedianCut() {
  removePaletteTable("#median-cut-palette");
  $("#median-cut-output").hide();
  var medianCutInputValue = parseInt($("#median-cut-input").val());
  console.log("running median cut with input " + medianCutInputValue);
  /* medianCutAndPlot(pixels, medianCutInputValue);*/
  var groupsWithInfo = {
    points: pixels,
    xMin: 0,
    xMax: 255,
    yMin: 0,
    yMax: 255,
    zMin: 0,
    zMax: 255
  };

  let medianCutRunner = new MedianCutRunner();
  let result = medianCutRunner.run([groupsWithInfo], [], 0, medianCutInputValue);
  var groups = _.map(result.groups, function(g) {return g.points;});
  var cuts = result.cuts;

  let medianCutPlotter = new MedianCutPlotter();
  medianCutPlotter.plot("median-cut-plot", groups, cuts);

  PaletteTableWriter.drawPaletteTable("#median-cut-palette", groups);

  $("#median-cut-output").show();
}

function runKMeans(){
  removePaletteTable("#kmeans-palette");
  $("#kmeans-output").hide();
  var kMeansInputValue = parseInt($("#kmeans-input").val());
  console.log("running kmeans with input " + kMeansInputValue);
  kMeansAndPlot(pixels, kMeansInputValue, 100);
}

function removePaletteTable(containerId) {
  $(containerId).empty();
}


function plotOriginalData(pixels) {
  console.log("will plot " + pixels.length + " pixels");
  var colors = _.map(pixels, function(p, index){
    return "rgb(" + p.red + "," + p.green + "," + p.blue + ")";
  });

  var data = {
    x: _.map(pixels, function(p){ return p.red; }),
    y: _.map(pixels, function(p){ return p.green; }),
    z: _.map(pixels, function(p){ return p.blue; }),
    mode: 'markers',
    marker: {
      size: 3,
      color: colors,
      line: {
        color: 'rgb(100,100,100)',
        width: 1
      }
    },
    type: 'scatter3d'
  };

  var layout = {
    margin: { l:0, r:0, b: 0, t: 0 },
    scene: {
      xaxis: { title: "Red" },
      yaxis: { title: "Green"},
      zaxis: { title: "Blue"}
    }
  };

  Plotly.newPlot('input-image-plot', [data], layout);
  $("#input-image-plot").show();
  $(".input-image-panel").show();
}

// =======================================================
// ================== KMeans Start =======================
// =======================================================

function kMeansAndPlot(pixels, k, numRuns) {
  var bestResult = null;
  var bestError = Infinity;

  for(var attempt=0; attempt<numRuns; attempt++) {
    result = kMeans(pixels, k);
    if(result.error < bestError) {
      bestResult = result.groups;
      bestError = result.error;
    }
  }
  plotClusters(bestResult, "kmeans-plot");
  PaletteTableWriter.drawPaletteTable("#kmeans-palette", bestResult);
  $("#kmeans-output").show();
}

function kMeans(pixels, k) {
  // randomly initialize means
  var means = [];
  for(m=0; m<k; m++){
    var pixel = pixels[Math.floor(Math.random()*pixels.length)];
    means.push(pixel);
  }

  var done = false;
  var result = null;
  while(!done) {
    result = groupPointsByMeans(means, pixels);
    newMeans = computeMeans(result.groups);
    done = isDone(means, newMeans);
  }

  console.log("Finished KMeans, error is " + result.error);
  return {
    groups: result.groups,
    error: result.error
  };
}

function computeMeans(groups) {
  return _.map(groups, function(group) {
    var averageColor = ImageUtil.computeAverageColor(group);
    return [averageColor.red, averageColor.green, averageColor.blue];
  });
}

function isDone(meansA, meansB) {
  var result = true;
  _.each(meansA, function(mean) {
    result = result | _.includes(meansB, mean);
  });
  return result;
}

function groupPointsByMeans(means, points) {
  var totalError = 0;
  var groups = _.map(means, function(m) { return []; });

  _.each(points, function(point) {
    var bestGroupIndex;
    var bestGroupError = Infinity;
    _.each(means, function(mean, index) {
      var error = distance(point, mean);
      if (error < bestGroupError) {
        bestGroupError = error;
        bestGroupIndex = index;
      }
    });
    groups[bestGroupIndex].push(point);
    totalError += bestGroupError;
  });
  return {
    means: means,
    groups: groups,
    error: totalError
  };
}

function distance(pointA, pointB) {
  var squaredDiffs = _.map(pointA, function(dim, index) {
    var diff = pointA[index] - pointB[index];
    return diff * diff;
  });
  return Math.sqrt(_.sum(squaredDiffs));
}

// =======================================================
// ================== KMeans End =========================
// =======================================================

function plotClusters(pointGroups, elementId){
  var data = _.map(pointGroups, function(group){
    var avgColor = ImageUtil.computeAverageColor(group);
    var colorString = "rgb(" + parseInt(avgColor.red) + "," + parseInt(avgColor.green) + "," + parseInt(avgColor.blue) + ")";
    return {
      x: _.map(group, function(p){ return p.red; }),
      y: _.map(group, function(p){ return p.green; }),
      z: _.map(group, function(p){ return p.blue; }),
      mode: 'markers',
      marker: {
        color: colorString,
        size: 3,
        line: {
          color: 'rgb(100,100,100)',
          width: 1
        }
      },
      type: 'scatter3d'
    };
  });

  var layout = {
    margin: { l:0, r:0, b: 0, t: 0 },
    scene: {
      xaxis: { title: "Red" },
      yaxis: { title: "Green"},
      zaxis: { title: "Blue"}
    }
  };

  Plotly.newPlot(elementId, data, layout);
}





$(".plot-toggle-header").click(function() {
  $header = $(this);
  //getting the next element
  $content = $header.next();
  //open up the content needed - toggle the slide- if visible, slide up, if not slidedown.
  $content.slideToggle(300, function () {});
});


$(document).ready(function() {
  document.getElementById('file').addEventListener('change', handleFileSelect, false);

  $("#run-histogram").click(runHistogram);
  $("#run-median-cut").click(runMedianCut);
  $("#run-kmeans").click(runKMeans);
});
