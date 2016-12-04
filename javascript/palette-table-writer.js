const _ = require("lodash");
const $ = require("jquery");
const ImageUtil = require("./image-util.js");

class PaletteTableWriter {

  static drawPaletteTable(containerId, pixelGroups) {
    var paletteTableString = "";

    // Table Header
    paletteTableString += "<tr>";
    paletteTableString += "<th>Color Code</th>";
    paletteTableString += "<th>Color</th>";
    paletteTableString += "<th>Percent</th>";
    paletteTableString += "</tr>";

    var totalPixels = _.chain(pixelGroups)
                       .map(function(b) {return b.length;})
                       .sum()
                       .value();

    pixelGroups = _.sortBy(pixelGroups, function(pg) {
      var averageColor = ImageUtil.computeAverageColor(pg);
      var hsl = ImageUtil.rgbToHsl(averageColor.red, averageColor.green, averageColor.blue);
      return hsl[0];
    }).reverse();

    _.each(pixelGroups, function(group) {
      var averageColor = ImageUtil.computeAverageColor(group);
      var percent = group.length / totalPixels;
      paletteTableString += "<tr>";
      paletteTableString += "<td>";
      paletteTableString += ImageUtil.pixelToHexString(averageColor);
      paletteTableString += "</td>";
      paletteTableString += "<td>";
      paletteTableString += ImageUtil.getColorPreviewHtmlString(averageColor);
      paletteTableString += "</td>";
      paletteTableString += "<td>";
      paletteTableString += (percent * 100).toFixed(2);
      paletteTableString += "</td>";
      paletteTableString += "</tr>";
    });
    $(containerId).append("<table class=\"table\">" + paletteTableString + "</table");
    $(containerId).show();
  }

}

module.exports = PaletteTableWriter;
