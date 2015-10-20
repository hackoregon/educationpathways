/**
 * Created by cvonsee on 10/19/15.
 */
var url = 'http://chrisv-cs-test.apigee.net/sankey';
var filterLabels = {
    gender: "Gender",
    ethnicity: "Ethnicity",
    poverty: "Poverty",
    lep: "English Proficiency",
    meet_math: "Math Proficiency",
    meet_read: "Reading Proficiency",
    district: "District",
    hs_name: "High School"
};

function buildSankeyFilterControls(divId, filterObject) {
    var root = document.getElementById(divId);

    // We're doing this in two passes - create SELECTs, then populate controls - so that the
    // SELECTs always appear on the page in the same order.
    Object.keys(filterObject).forEach(function (filter) {
        if (typeof filterObject[filter] === 'function') {
            return;
        }
        var select = document.createElement('select');
        select.setAttribute('id', divId + '-select-' + filter);

        var nofilter = document.createElement('option');
        nofilter.appendChild(document.createTextNode('No filter'));
        select.appendChild(nofilter);

        select.addEventListener('change', function (e) {
            filterObject[filter] = e.target.value;
            filterObject.redraw();
        });

        var label = document.createElement('label');
        label.appendChild(document.createTextNode(filterLabels[filter]));
        label.appendChild(document.createElement("br"));
        label.appendChild(select);
        root.appendChild(label);
        root.appendChild(document.createElement("br"));
    });

    Object.keys(filterObject).forEach(function (filter) {
        if (typeof filterObject[filter] === 'function') {
            return;
        }
        d3.json(url + '/meta/' + filter + '/?format=json', function (filterOptions) {
            var select = document.getElementById(divId + '-select-' + filter);
            for (var key in filterOptions) {
                var option = document.createElement('option');
                option.appendChild(document.createTextNode(filterOptions[key]));
                select.appendChild(option);
                option.value = key;
            }
        });
    });
}

function buildComparisonFilterControls(divId, filterObject) {
    // Create one SELECT with all of the options from all filter criteria except 'district' and 'hs_name'
    var root = document.getElementById(divId);
    var select = document.createElement('select');
    select.setAttribute('id', divId + '-comparisonselect');

    var nofilter = document.createElement('option');
    nofilter.appendChild(document.createTextNode('No filter'));
    select.appendChild(nofilter);

    select.addEventListener('change', function (e) {
        filterObject[filter] = e.target.value;
        filterObject.redraw();
    });

    var label = document.createElement('label');
    label.appendChild(document.createTextNode('Comparison criteria'));
    label.appendChild(document.createElement("br"));
    label.appendChild(select);
    root.appendChild(label);
    root.appendChild(document.createElement("br"));

    Object.keys(filterObject).forEach(function (filter) {
        if ((typeof filterObject[filter] === 'function') || (filter === 'district') || (filter === 'hs_name')) {
            return;
        }

        // TODO These show up in the order in which the API calls return.  Need to figure out a way to fix that.
        d3.json(url + '/meta/' + filter + '/?format=json', function (filterOptions) {
            var s = document.getElementById(divId + '-comparisonselect');

            for (var key in filterOptions) {
                if (key === 'null')
                    continue;
                var option = document.createElement('option');
                option.appendChild(document.createTextNode(filterLabels[filter] + ": " + filterOptions[key]));
                s.appendChild(option);
                option.value = key;
            }
        });
    });

    // Create SELECTs for the district and HS name.
    var remainingCriteria = [ 'district', 'hs_name' ];
    remainingCriteria.forEach(function (filter) {
        if (typeof filterObject[filter] === 'function') {
            return;
        }
        var s = document.createElement('select');
        s.setAttribute('id', divId + '-compareselect-' + filter);

        var nf = document.createElement('option');
        nf.appendChild(document.createTextNode('No filter'));
        s.appendChild(nf);

        s.addEventListener('change', function (e) {
            filterObject[filter] = e.target.value;
            filterObject.redraw();
        });

        var l = document.createElement('label');
        l.appendChild(document.createTextNode(filterLabels[filter]));
        l.appendChild(document.createElement("br"));
        l.appendChild(s);
        root.appendChild(l);
        root.appendChild(document.createElement("br"));
    });

    remainingCriteria.forEach(function(filter) {
        var s = document.getElementById(divId + '-compareselect-' + filter);
        d3.json(url + '/meta/' + filter + '/?format=json', function (filterOptions) {
            for (var key in filterOptions) {
                var o = document.createElement('option');
                o.appendChild(document.createTextNode(filterOptions[key]));
                s.appendChild(o);
                o.value = key;
            }
        });
    });

}
