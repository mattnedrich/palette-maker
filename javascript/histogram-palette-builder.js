const _ = require("lodash");
const ImageUtil = require("./image-util.js");

const DIMENSION_MAX = 256;

class HistogramPaletteBuilder {

  getKeyForPixel(pixel, bucketsPerDimension) {
    var bucketSize = DIMENSION_MAX / bucketsPerDimension;
    var redBucket = Math.floor(pixel.red / bucketSize);
    var greenBucket = Math.floor(pixel.green / bucketSize);
    var blueBucket = Math.floor(pixel.blue / bucketSize);
    var key = redBucket + ":" + greenBucket + ":" + blueBucket;
    return key;
  }

  binPixels(pixels, bucketsPerDimension) {
    let bucketMap = {};
    _.each(pixels, (pixel) => {
      let key = this.getKeyForPixel(pixel, bucketsPerDimension);
      if(key in bucketMap) {
        bucketMap[key].push(pixel);
      } else {
        bucketMap[key] = [pixel];
      }
    });

    // sort buckets
    let buckets = _.values(bucketMap);
    let sortedBuckets = _.sortBy(buckets, (bucket) => {return bucket.length; }).reverse();

    let bucketColors = _.map(pixels, (p, index) => {
      let key = this.getKeyForPixel(p, bucketsPerDimension);
      let pixelsInBucket = bucketMap[key];
      let averageColor = ImageUtil.computeAverageColor(pixelsInBucket);
      return averageColor;
    });

    return {
      buckets: sortedBuckets,
      colors: bucketColors
    };
  }

}

module.exports = HistogramPaletteBuilder;
