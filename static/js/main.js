let data;
let manualCentroids = [];
let kmeans;
let currentStep = 0;

const width = 800;
const height = 500;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const svg = d3.select("#plot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const x = d3.scaleLinear().range([margin.left, width - margin.right]);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

function updatePlot(points, centroids, labels) {
    const xExtent = d3.extent(points, d => d[0]);
    const yExtent = d3.extent(points, d => d[1]);
    const maxExtent = Math.max(
        Math.abs(xExtent[0]), Math.abs(xExtent[1]),
        Math.abs(yExtent[0]), Math.abs(yExtent[1])
    );
    
    x.domain([-maxExtent, maxExtent]).nice();
    y.domain([-maxExtent, maxExtent]).nice();

    svg.selectAll("*").remove();

    // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${y(0)})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(${x(0)},0)`)
        .call(d3.axisLeft(y));

    // Add data points
    svg.selectAll("circle.point")
        .data(points)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d[0]))
        .attr("cy", d => y(d[1]))
        .attr("r", 3)
        .attr("fill", (d, i) => labels ? colorScale(labels[i]) : "#3498db");

    // Add centroids
    svg.selectAll("path.centroid")
        .data(centroids)
        .enter()
        .append("path")
        .attr("class", "centroid")
        .attr("d", d3.symbol().type(d3.symbolCross).size(100))
        .attr("transform", d => `translate(${x(d[0])},${y(d[1])})`)
        .attr("fill", "red")
        .attr("stroke", "black");
}

function generateData() {
    const numClusters = parseInt(document.getElementById("num-clusters").value);
    const numPoints = 300;
    fetch('/generate_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ n_clusters: numClusters }),
    })
    .then(response => response.json())
    .then(result => {
        data = result.data;
        updatePlot(data, [], []);
        manualCentroids = [];
        currentStep = 0;
        document.getElementById("step").disabled = false;
        document.getElementById("converge").disabled = false;
    });
}

document.getElementById("generate-data").addEventListener("click", generateData);

document.getElementById("step").addEventListener("click", function() {
    const numClusters = parseInt(document.getElementById("num-clusters").value);
    const method = document.getElementById("init-method").value;
    
    if (method === "manual" && manualCentroids.length !== numClusters) {
        console.log(`Please place exactly ${numClusters} centroids before starting the algorithm.`);
        return;
    }
    
    if (currentStep === 0) {
        fetch('/initialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                n_clusters: numClusters, 
                method: method,
                centroids: method === 'manual' ? manualCentroids : null
            }),
        })
        .then(response => response.json())
        .then(result => {
            kmeans = result;
            updatePlot(data, kmeans.centroids, kmeans.labels);
            currentStep++;
            console.log("KMeans initialized. Click 'Step Through KMeans' to continue.");
        });
    } else {
        fetch('/step', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        })
        .then(response => response.json())
        .then(result => {
            kmeans = result;
            updatePlot(data, kmeans.centroids, kmeans.labels);
            currentStep++;
            console.log(`Step ${currentStep} completed. Centroids updated.`);
        });
    }
});

document.getElementById("converge").addEventListener("click", function() {
    const numClusters = parseInt(document.getElementById("num-clusters").value);
    const method = document.getElementById("init-method").value;
    
    fetch('/converge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            n_clusters: numClusters, 
            method: method,
            centroids: method === 'manual' ? manualCentroids : null
        }),
    })
    .then(response => response.json())
    .then(result => {
        kmeans = result;
        updatePlot(data, kmeans.centroids, kmeans.labels);
        currentStep = -1;
        document.getElementById("step").disabled = true;
    });
});

document.getElementById("reset").addEventListener("click", function() {
    updatePlot(data, [], []);
    manualCentroids = [];
    currentStep = 0;
    document.getElementById("step").disabled = false;
    document.getElementById("converge").disabled = false;
});

svg.on("click", function(event) {
    const method = document.getElementById("init-method").value;
    const numClusters = parseInt(document.getElementById("num-clusters").value);
    
    if (method === "manual") {
        if (manualCentroids.length < numClusters) {
            const [mouseX, mouseY] = d3.pointer(event);
            const dataX = x.invert(mouseX);
            const dataY = y.invert(mouseY);
            manualCentroids.push([dataX, dataY]);
            updatePlot(data, manualCentroids, []);
            
            if (manualCentroids.length === numClusters) {
                console.log("All centroids placed. You can now step through or run to convergence.");
            }
        } else {
            console.log("Maximum number of centroids reached. Use 'Reset Algorithm' to start over.");
        }
    }
});

generateData();