// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.

} else {
  alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
  var file = evt.target.files[0]; // FileList object

  console.log("file is " + file);

  var start = 0;
  var stop = file.size - 1;

  var reader = new FileReader();

  reader.onload = (function(theFile) {
    return function(e) {
      var span = document.createElement('span');
      span.innerHTML = ['<img id=img src="', e.target.result,
                        '" title="', escape(theFile.name), '"/>'].join('');
      document.getElementById('original-image-hidden').insertBefore(span, null);
      var img = document.getElementById('img');

      var image = document.getElementById('original-image');
      image.src = e.target.result;

      run();
    };
  })(file);

  reader.readAsDataURL(file);
}

function run(){
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

  console.log("Canvas size: " + canvas.width + "x" + canvas.height);
  var pixelData = canvas.getContext('2d').getImageData(0, 0, 1, 1).data;
  console.log("pixel data: " + pixelData);

  var pixelsX = [];
  var pixelsY = [];
  var pixelsZ = [];
  for (var x=0; x < canvas.width; x++){
    for (var y=0; y < canvas.height; y++){
      var pixel = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
      pixelsX.push(pixel[0]);
      pixelsY.push(pixel[1]);
      pixelsZ.push(pixel[2]);
    }
  }
  plotWithPlotly(pixelsX, pixelsY, pixelsZ);
}

function plotWithPlotly(pixelsX, pixelsY, pixelsZ){
  var colorData = _.map(pixelsX, function(x, index){
    var xval = pixelsX[index];
    var yval = pixelsY[index];
    var zval = pixelsZ[index];
    return "rgb(" + xval + "," + yval + "," + zval + ")";
  });

  var data = {
    x: pixelsX,
    y: pixelsY,
    z: pixelsZ,
    mode: 'markers',
    marker: {
      size: 5,
      color: colorData,
      line: {
        color: 'rgb(100,100,100)',
        width: 1
      }
    },
    type: 'scatter3d'
  };

  var layout = {
    margin: { l:0, r:0, b: 0, t: 0 }
  };

  Plotly.newPlot('plot', [data], layout);
}

document.getElementById('files').addEventListener('change', handleFileSelect, false);
