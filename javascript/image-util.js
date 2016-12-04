
class ImageUtil {
  static rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
      h = s = 0; // achromatic
    }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, l];
  }


  static getPixelLuminance(pixel) {
    return (pixel.red * 0.2126) + (pixel.green * 0.7152) + (pixel.blue * 0.0722);
  }

  static pixelToString(pixel) {
    return "r: " + pixel.red + ", g: " + pixel.green + ", b: " + pixel.blue;
  }

  static numberToPaddedHexString(number) {
    var hexString = parseInt(number).toString(16);
    if(hexString.length == 1) {
      return "0" + hexString;
    }
    return hexString
  }

  static pixelToHexString(pixel) {
    var hexString = "#" +
                    ImageUtil.numberToPaddedHexString(pixel.red) +
                    ImageUtil.numberToPaddedHexString(pixel.green) +
                    ImageUtil.numberToPaddedHexString(pixel.blue);
    return hexString;
  }

  static getColorPreviewHtmlString(color) {
    var color = ImageUtil.pixelToHexString(color);
    return "<div class=\"colorPreview\" style=\"background:" + color + "\"></div>";
  }

  static computeAverageColor(pixels){
    var totalRed = _.chain(pixels)
                    .map(function(p){ return p.red; })
                    .sum()
                    .value();
    var totalGreen = _.chain(pixels)
                      .map(function(p){ return p.green; })
                      .sum()
                      .value();
    var totalBlue = _.chain(pixels)
                     .map(function(p){ return p.blue; })
                     .sum()
                     .value();
    return {
      red: (totalRed / pixels.length),
      green: (totalGreen / pixels.length),
      blue: (totalBlue / pixels.length)
    };
  }

}


module.exports = ImageUtil;
