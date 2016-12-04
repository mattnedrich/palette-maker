const _ = require("lodash");
const ImageUtil = require("./image-util.js");

class MedianCutPlotter {

  plot(elementId, groups, cuts) {
    let data = _.map(groups, (group) => {
      var avgColor = ImageUtil.computeAverageColor(group);
      var colorString = "rgb(" + parseInt(avgColor.red) + "," + parseInt(avgColor.green) + "," + parseInt(avgColor.blue) + ")";
      return {
        x: _.map(group, (p) => { return p.red; }),
        y: _.map(group, (p) => { return p.green; }),
        z: _.map(group, (p) => { return p.blue; }),
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

    var meshes = _.map(cuts, (cut) => {
      var allX = _.map(cut, (point) => {
        return point.x;
      });
      var allY = _.map(cut, (point) => {
        return point.y;
      });
      var allZ = _.map(cut, (point) => {
        return point.z;
      });
      return {
        opacity:0.175,
        color:'rgb(100,100,100)',
        type: 'mesh3d',
        x: allX,
        y: allY,
        z: allZ,
        name: "grid"
      };
    });

    _.each(meshes, (mesh) => {
      data.push(mesh);
    });

    Plotly.newPlot(elementId, data, layout);
  }

}

module.exports = MedianCutPlotter;
