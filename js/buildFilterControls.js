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

function buildComparisonFilterControls(divId, filterObject) {
    // Create one SELECT with all of the options from all filter criteria except 'district' and 'hs_name'
    var root = document.getElementById(divId);
    var select = document.createElement('select');
    select.setAttribute('id', divId + '-comparisonselect');

    var nofilter = document.createElement('option');
    nofilter.appendChild(document.createTextNode('No filter'));
    select.appendChild(nofilter);
    nofilter.value = 'clear';

    select.addEventListener('change', function (e) {
        if ('clear' === e.target.value) {
            Object.keys(filterObject).forEach(function (filter) {
                // clear all of the properties except district and hs_name, because those are in separate drop-downs
                if ((typeof filterObject[filter] === 'function') || (filter === 'district') || (filter === 'hs_name')) {
                    return;
                } else {
                    filterObject[filter] = '';
                }
            });
        } else {
            // clear existing filters, then apply new ones.
            Object.keys(filterObject).forEach(function (filter) {
                // begin wonky part - need to hand-wire these options and not take the options from the API.  Has to be done
                // in the loop to keep "filter" value in context so it can be used in the event listener.
                if ((typeof filterObject[filter] === 'function') || (filter === 'district') || (filter === 'hs_name')) {
                    return;  // don't clear these - they're treated separately.
                } else {
                    filterObject[filter] = '';
                }
            });
            var splits = e.target.value.split(":");
            filterObject[splits[0]] = splits[1];
        }
        filterObject.redraw();
    });
    var container = document.createElement('div');
    container.setAttribute('class', 'filter-container')
    var label = document.createElement('label');
    label.appendChild(document.createTextNode('Comparison criteria'));
    label.appendChild(document.createElement("br"));
    container.appendChild(label);
    container.appendChild(select);
    root.appendChild(container);

    Object.keys(filterObject).forEach(function (filter) {
        // begin wonky part - need to hand-wire these options and not take the options from the API.  Has to be done
        // in the loop to keep "filter" value in context so it can be used in the event listener.
        if ((typeof filterObject[filter] === 'function') || (filter === 'district') || (filter === 'hs_name')) {
            return;
        } else if (filter === 'meet_read') {
            o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['meet_read'] + ": " + "Met or exceeded expectations"));
            select.appendChild(o);
            o.value = "meet_read:2,3";
            o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['meet_read'] + ": " + "Did not meet expectations"));
            select.appendChild(o);
            o.value = "meet_read:1";
        } else if (filter === 'meet_math') {
            o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['meet_math'] + ": " + "Met or exceeded expectations"));
            select.appendChild(o);
            o.value = "meet_math:2,3";
            o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['meet_math'] + ": " + "Did not meet expectations"));
            select.appendChild(o);
            o.value = "meet_math:1";
        } else if (filter === 'ethnicity') {
            var o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['ethnicity'] + ": " + "White"));
            select.appendChild(o);
            o.value = "ethnicity:5";
            o = document.createElement('option');
            o.appendChild(document.createTextNode(filterLabels['ethnicity'] + ": " + "Non-White"));
            select.appendChild(o);
            o.value = "ethnicity:1,2,3,4,6";
        }
        // end wonky part
        else {
            // TODO These show up in the order in which the API calls return.  Need to figure out a way to fix that.
            d3.json(url + '/meta/' + filter + '/?format=json', function (filterOptions) {
                var s = document.getElementById(divId + '-comparisonselect');

                for (var key in filterOptions) {
                    if (key === 'null')
                        continue;
                    var option = document.createElement('option');
                    option.appendChild(document.createTextNode(filterLabels[filter] + ": " + filterOptions[key]));
                    s.appendChild(option);
                    option.value = filter + ":" + key;
                }
            });
        }
    });

    // Create SELECTs for the district and HS name.
    var remainingCriteria = [ 'district', 'hs_name' ];
    remainingCriteria.forEach(function (filter) {
        if (typeof filterObject[filter] === 'function') {
            return;
        }
        var wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'filter-container')
        var s = document.createElement('select');
        s.setAttribute('id', divId + '-compareselect-' + filter);

        var nf = document.createElement('option');
        nf.appendChild(document.createTextNode('No filter'));
        s.appendChild(nf);
        nf.value = 'clear';

        s.addEventListener('change', function (e) {
            // since we can only have either hs_name or district set and not both, clear all filters before setting
            // any.  We also need to reset the selected indexes on hs_name and district to 0.
            var parentDiv = e.target.parentNode.parentNode;  // first parent is 'label'; second is the one we need.
            var parentDivId = parentDiv.getAttribute("id");
            var hsNameSelect = document.getElementById(parentDivId + "-compareselect-" + remainingCriteria[1]);
            var districtSelect = document.getElementById(parentDivId + "-compareselect-" + remainingCriteria[0]);
            var savedValue = filterObject[filter];
            if (filter === 'hs_name') {
                filterObject['hs_name'] = e.target.value;
                districtSelect.selectedIndex = 0;
                filterObject['district'] = '';
            } else if (filter === 'district') {
                filterObject['district'] = e.target.value;
                hsNameSelect.selectedIndex = 0;
                filterObject['hs_name'] = '';
            }

            if (filterObject[filter] === 'clear')
                filterObject[filter] = '';

            var allEmpty = (filterObject[remainingCriteria[0]] === '') && (filterObject[remainingCriteria[1]] === '');
            if (allEmpty) {
                alert("You must specify either a high school name or a district name, and not both.");
                e.target.selectedIndex = 1;
                filterObject[filter] = savedValue;
            }
            filterObject.redraw();
        });

        var l = document.createElement('label');
        l.appendChild(document.createTextNode(filterLabels[filter]));
        wrapper.appendChild(l);
        wrapper.appendChild(s);
        root.appendChild(wrapper);
    });

    remainingCriteria.forEach(function(filter, filterIdx) {
        var s = document.getElementById(divId + '-compareselect-' + filter);
        var defaultSet = false;
        d3.json(url + '/meta/' + filter + '/?format=json', function (filterOptions) {
            for (var key in filterOptions) {
                var o = document.createElement('option');
                o.appendChild(document.createTextNode(filterOptions[key]));
                s.appendChild(o);
                if ((filterIdx == 0) && (!defaultSet)) {
                    o.defaultSelected = true;
                    filterObject[filter] = key;
                    defaultSet = true;
                }
                o.value = key;
            }
        });
    });

}
