var educationNodes = {
 codes: {
   B: "Bachelor+",
   A: "Associate",
   C: "Certificate",
   F: "Enroll 4 Year",
   4: "Enroll 4 Year",
   T: "Enroll 2 Year",
   2: "Enroll 2 Year",
   G: "HS Graduate",
   D: "HS Diploma",
   X: "Did not graduate",
   Z: "No achievements",
   H: "Highschool",
 },
 priority: ['B', 'A', 'C', 'F', '4', 'T', '2', 'G', 'D', 'X', 'Z', 'H']
};

function filterData(data, filters) {
 return data.filter(function (group) {
   return !filters || filters.every(
     function(filter) {
       return group.path.indexOf(filter) > -1;
     });
 });
}

var transformData = (function() {
    function getCode(stage, index) {
     switch (stage + index) {
       case 'X2':
       case 'X3':
       case 'X4':
         return 'Z';
       case '43':
         return 'F';
       case '23':
         return 'T';
       default:
         return stage;
     }
    }

    function cleanup(data) {
     return Object.keys(data)
       .reduce(function (r, n) {

         var key = n.replace('S', '');
         if (key.indexOf('2') === 1) {
           key = key.split('')[0] + key.substring(2);
         }

         if (data[n] > 0) {
           r[key] = (r[key] || 0) + data[n];
         }

         return r;
       }, {});
    }

    function map(data) {
     var paths = [];

     for (var key in data) {
       var result = key.split('')
         .reduce(function (path, stage, index) {
           path.push(getCode(stage, index));

           if (index === 2 && key.length === 4) {
             path.push(getCode(stage, 3));
           }

           return path;
         }, []);

       paths.push({
         value: data[key],
         path: result
       });
     }

     return paths;
    }

    return function (data) {
     return map(cleanup(data));
    };
}());

var dial_div = document.getElementById("grad-rate");
var width = parseInt(dial_div.offsetWidth);
var height = width;

// An arc function with all values bound except the endAngle. So, to compute an
// SVG path string for a given angle, we pass an object with an endAngle
// property to the `arc` function, and it will return the corresponding string.
var arc = d3.svg.arc()
    .innerRadius(width / 3)
    .outerRadius(width * .475)
    .startAngle(Math.PI / 2);


var updateGradRate = createGraph('grad-rate');
var updateFourRate = createGraph('four-rate');
var updateTwoRate = createGraph('two-rate');
var updatePovertyRate = createGraph('poverty-rate');
var updatePostEnrollRate = createGraph('post-enroll-rate');
var updateHLAARate = createGraph('HLAA-rate');
var filter = "";
var group = "hs_name";
var rates_array = [];
var current_rates = {};

d3.csv('data/rate_distributions.csv', function (data) {
    data.forEach( function (d) {
        // converts data from strings to integers.  I don't know how.
        d.count = +d.count;
        d.grad_rate_mean = +d.grad_rate_mean;
        d.grad_rate_sd = +d.grad_rate_sd;
        d.post_enroll_rate_mean = +d.post_enroll_rate_mean;
        d.post_enroll_rate_sd = +d.post_enroll_rate_sd;
        d.four_rate_mean = +d.four_rate_mean;
        d.four_rate_sd = +d.four_rate_sd;
        d.two_rate_mean = +d.two_rate_mean;
        d.two_rate_sd = +d.two_rate_sd;
        d.HLAA_rate_mean = +d.HLAA_rate_mean;
        d.HLAA_rate_sd = +d.HLAA_rate_sd;
    });
    rates_array = data;
    //create filters / select initial row
    distributions = rowSelect(data, filter, group);
    //updatecharts
    updateData('&hs_name=Grant_High_School');
});

function rowSelect(data, filter_str, group) {
    for (var i=0; i < data.length; i++) {
        if (data[i].filter === filter_str && data[i].class === group) {
            return data[i];
        }
    }
}

// passes the "score" of each rate relative to the rest of the scores in the
// group to the respective update functions
function updateData() {
    d3.json(''.concat('http://52.10.251.161/sankey/?format=json', comparisonFilters.query()), function (error, data) {
        var hs_grads = codeSum(filterData(transformData(data), ['G']));
        var hs_dropouts = codeSum(filterData(transformData(data), ['X']));
        var total_students = hs_grads + hs_dropouts;
        var grad_rate = hs_grads / total_students;
        var graduated_4_yr = codeSum(filterData(transformData(data), ['B']));
        var four_rate = graduated_4_yr / total_students;
        var no_diploma = codeSum(filterData(transformData(data), ['Z']));
        var hs_diploma = codeSum(filterData(transformData(data), ['D']));
        var graduated_2_yr = total_students - graduated_4_yr - hs_diploma - no_diploma;
        var two_rate = graduated_2_yr / total_students;
        var enrolled_2_yr = codeSum(filterData(transformData(data), ['2']));
        var enrolled_4_yr = codeSum(filterData(transformData(data), ['4']));
        var post_enroll_rate = (enrolled_2_yr + enrolled_4_yr) / total_students;
        var grad_2_only = 0;
        var filtersets = [['2', 'C'], ['2', 'A']];
        for (var key in filtersets) {
            grad_2_only = grad_2_only + codeSum(filterData(transformData(data), filtersets[key]));
            filtersets[key].push('F')
            grad_2_only = grad_2_only - codeSum(filterData(transformData(data), filtersets[key]));
        }
        var HLAA_rate = (graduated_4_yr + grad_2_only) / (enrolled_2_yr + enrolled_4_yr)
        updateGradRate(zScore(distributions.grad_rate_mean, distributions.grad_rate_sd, grad_rate));
        updateFourRate(zScore(distributions.four_rate_mean, distributions.four_rate_sd, four_rate));
        updateTwoRate(zScore(distributions.two_rate_mean, distributions.two_rate_sd, two_rate));
        updatePovertyRate(0.34);
        updatePostEnrollRate(zScore(distributions.post_enroll_rate_mean, distributions.post_enroll_rate_sd, post_enroll_rate));
        updateHLAARate(zScore(distributions.HLAA_rate_mean, distributions.HLAA_rate_sd, HLAA_rate));
    });
}

function codeSum (data_list) {
    if (data_list.length != 0) {
        total = 0
        for (track in data_list) {
            total = total + data_list[track]['value']
        }
        return total
    } else {
        return 0
    }
}

// counts how many standard deviations above or below the mean a particular
// value is, imposing a max of 3 and a min of -3.
function zScore(mean, sd, value) {
    var score = (value - mean) / sd;
    if (score < -3) {
        return -3;
    } else if (score > 3) {
        return 3;
    } else {
        return score;
    }
}

function createGraph(id) {
    var svg = d3.select('#' + id).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + width / 2 + ")")

    // Add the background arc, from -90 to 90 degrees.
    // var background = svg.append("path")
    //     .datum({endAngle: Math.PI / 2})
    //     .style("fill", "#ddd")
    //     .attr("d", arc);

    // Add the foreground arc in gold, starting at 0 for update effect.
    var foreground = svg.append("path")
        .datum({endAngle: Math.PI / 2})
        .style("fill", "#dcc871")
        .attr("d", arc);

    var icon = svg.append("image")
        .attr("xlink:href", "img/icons/" + id + ".svg")
        .attr("width", width / 4)
        .attr("height", width / 4)
        .attr("transform", "translate(" + -width / 8 + "," + -width / 8 + ")")

    // creates the desired movement effect on value update.
    function arcTween(transition, newAngle) {
      transition.attrTween("d", function(d) {
        var interpolate = d3.interpolate(d.endAngle, newAngle);
        return function(t) {
          d.endAngle = interpolate(t);
          return arc(d);
        };
      });
    }

    // converts the computed "score" to an angle between -90 and 90 degrees,
    // then updates the chart to reflect the new value.
    return function arcUpdate(value) {
      foreground.transition()
          .duration(750)
          .call(arcTween, (2 * value / 3 + 3) * Math.PI / 2);
    }
}
