// Global state
let dataset = [];
const classes = ["Sew", "Release", "Handle", "Prepare", "Check", "Wait", "Maintain", "Adjust"];
const classColors = {
  "Sew": "#d946ef",
  "Release": "#f43f5e",
  "Handle": "#f59e0b",
  "Prepare": "#10b981",
  "Check": "#06b6d4",
  "Wait": "#6366f1",
  "Maintain": "#ec4899",
  "Adjust": "#3b82f6"
};

// DOM elements
const hoverCard = document.getElementById("hover-card");
const hoverImg = document.getElementById("hover-img");
const hoverTitle = document.getElementById("hover-title");
const hoverClass = document.getElementById("hover-class");
const hoverMeta = document.getElementById("hover-meta");

const galleryGrid = document.getElementById("gallery-grid");
const galleryTabs = document.querySelectorAll(".tab-btn");
const classItems = document.querySelectorAll(".class-item");

const modal = document.getElementById("preview-modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalBadge = document.getElementById("modal-badge");
const modalCoords = document.getElementById("modal-coords");
const modalClose = document.getElementById("modal-close");

// Fetch t-SNE data on load
document.addEventListener("DOMContentLoaded", () => {
  fetch("tsne_data.json")
    .then(response => response.json())
    .then(data => {
      dataset = data;
      init3DPlot();
      renderGallery("all");
      initEventListeners();
    })
    .catch(err => {
      console.error("Error loading JSON dataset data:", err);
      alert("Failed to load t-SNE coordinate data. Make sure you run from a local server.");
    });
});

// Group data and initialize Plotly 3D plot
function init3DPlot() {
  const traces = {};

  // Initialize traces for each class
  classes.forEach(cls => {
    traces[cls] = {
      x: [], y: [], z: [],
      text: [],
      mode: 'markers',
      name: cls,
      type: 'scatter3d',
      marker: {
        size: 5,
        color: classColors[cls],
        opacity: 0.8,
        line: {
          color: 'rgba(255, 255, 255, 0.1)',
          width: 0.5
        }
      },
      points: [] // Original data mapping
    };
  });

  // Distribute dataset points to traces
  dataset.forEach(pt => {
    const cls = pt.class_name;
    traces[cls].x.push(pt.x);
    traces[cls].y.push(pt.y);
    traces[cls].z.push(pt.z);
    traces[cls].text.push(`Class: ${cls}<br>Original Index: ${pt.original_idx}`);
    traces[cls].points.push(pt);
  });

  const plotData = Object.values(traces);

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 0, r: 0, t: 0, b: 0 },
    scene: {
      xaxis: {
        backgroundcolor: 'rgba(20, 24, 33, 0.5)',
        gridcolor: 'rgba(255, 255, 255, 0.05)',
        showbackground: true,
        zerolinecolor: 'rgba(255, 255, 255, 0.1)',
        tickfont: { color: '#9ca3af' }
      },
      yaxis: {
        backgroundcolor: 'rgba(20, 24, 33, 0.5)',
        gridcolor: 'rgba(255, 255, 255, 0.05)',
        showbackground: true,
        zerolinecolor: 'rgba(255, 255, 255, 0.1)',
        tickfont: { color: '#9ca3af' }
      },
      zaxis: {
        backgroundcolor: 'rgba(20, 24, 33, 0.5)',
        gridcolor: 'rgba(255, 255, 255, 0.05)',
        showbackground: true,
        zerolinecolor: 'rgba(255, 255, 255, 0.1)',
        tickfont: { color: '#9ca3af' }
      },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.2 }
      }
    },
    legend: {
      font: { color: '#f3f4f6' },
      orientation: 'h',
      y: 0.05,
      x: 0.5,
      xanchor: 'center'
    }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['sendDataToCloud', 'hoverCompareCartesian', 'hoverClosest3d'],
    displaylogo: false
  };

  Plotly.newPlot('plotly-div', plotData, layout, config);

  // Track mouse coordinates for hover card
  let mouseX = 0;
  let mouseY = 0;
  document.getElementById('plotly-div').addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Bind hover events
  const plotDiv = document.getElementById('plotly-div');

  plotDiv.on('plotly_hover', function (data) {
    if (data.points && data.points.length > 0) {
      const pt = data.points[0];
      const traceName = pt.data.name;
      const ptIdx = pt.pointNumber;
      const originalPoint = traces[traceName].points[ptIdx];

      showHoverCard(originalPoint, mouseX, mouseY);
    }
  });

  plotDiv.on('plotly_unhover', function () {
    hideHoverCard();
  });
}

// Display floating hover card
function showHoverCard(point, clientX, clientY) {
  hoverImg.src = point.image_path;
  hoverTitle.innerText = `Frame: VARSew #${point.original_idx}`;
  hoverClass.innerText = point.class_name;

  // Dynamic color for hover class badge
  hoverClass.className = "hover-class";
  hoverClass.style.backgroundColor = `${classColors[point.class_name]}30`;
  hoverClass.style.color = classColors[point.class_name];
  hoverClass.style.border = `1px solid ${classColors[point.class_name]}60`;

  hoverMeta.innerText = `X: ${point.x.toFixed(2)} | Y: ${point.y.toFixed(2)} | Z: ${point.z.toFixed(2)}`;

  // Position hover card
  const cardWidth = 240;
  const cardHeight = 100;

  // Add a small offset so it's not right under the cursor
  let left = clientX + 15;
  let top = clientY - cardHeight / 2;

  // Keep within window bounds
  if (left + cardWidth > window.innerWidth) {
    left = clientX - cardWidth - 15;
  }
  if (top + cardHeight > window.innerHeight) {
    top = window.innerHeight - cardHeight - 15;
  }
  if (top < 0) top = 15;

  // Get container offset if Plotly container is relative
  const plotContainer = document.querySelector('.plot-card').getBoundingClientRect();
  const relativeLeft = left - plotContainer.left;
  const relativeTop = top - plotContainer.top;

  hoverCard.style.left = `${relativeLeft}px`;
  hoverCard.style.top = `${relativeTop}px`;
  hoverCard.classList.add("visible");
}

function hideHoverCard() {
  hoverCard.classList.remove("visible");
}

// Render dynamic Image Gallery
function renderGallery(classFilter) {
  galleryGrid.innerHTML = "";

  const filtered = classFilter === "all"
    ? dataset
    : dataset.filter(pt => pt.class_idx === parseInt(classFilter));

  filtered.forEach(pt => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML = `
      <img class="gallery-img" src="${pt.image_path}" alt="Image" loading="lazy">
      <span class="gallery-label" style="color: ${classColors[pt.class_name]}">#${pt.original_idx}</span>
    `;

    item.addEventListener("click", () => showModal(pt));
    galleryGrid.appendChild(item);
  });
}

// Show preview modal
function showModal(point) {
  modalImg.src = point.image_path;
  modalTitle.innerText = `Action Frame #${point.original_idx}`;
  modalBadge.innerText = point.class_name;

  modalBadge.style.backgroundColor = `${classColors[point.class_name]}30`;
  modalBadge.style.color = classColors[point.class_name];
  modalBadge.style.border = `1px solid ${classColors[point.class_name]}60`;

  modalCoords.innerHTML = `
    <strong>t-SNE Coordinates:</strong><br>
    X: ${point.x.toFixed(4)}<br>
    Y: ${point.y.toFixed(4)}<br>
    Z: ${point.z.toFixed(4)}
  `;

  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
}

// Initialize controls & filters
function initEventListeners() {
  // Gallery Tabs filter
  galleryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      galleryTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const tabFilter = tab.getAttribute("data-tab");
      renderGallery(tabFilter);

      // Update Sidebar Selection to match
      classItems.forEach(item => {
        const itemClass = item.getAttribute("data-class");
        if ((tabFilter === "all" && itemClass === "all") || itemClass === tabFilter) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });

      highlightPlotlyClass(tabFilter);
    });
  });

  // Sidebar Legend filter
  classItems.forEach(item => {
    item.addEventListener("click", () => {
      classItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const classFilter = item.getAttribute("data-class");
      renderGallery(classFilter);

      // Update Tabs Selection to match
      galleryTabs.forEach(tab => {
        const tabFilter = tab.getAttribute("data-tab");
        if ((classFilter === "all" && tabFilter === "all") || tabFilter === classFilter) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });

      highlightPlotlyClass(classFilter);
    });
  });

  // Modal actions
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// Filter Plotly classes on legend click
function highlightPlotlyClass(classFilter) {
  const plotDiv = document.getElementById('plotly-div');
  const update = { marker: { size: [] } };

  // Reset sizes
  dataset.forEach(() => {
    update.marker.size.push(5);
  });

  if (classFilter !== "all") {
    const classIdx = parseInt(classFilter);
    const className = classes[classIdx];

    // In Plotly, we can restyle traces to highlight one and dim others
    const visibleTraces = [];
    const sizes = [];
    const opacities = [];

    classes.forEach((cls, idx) => {
      if (cls === className) {
        sizes.push(8);
        opacities.push(0.95);
      } else {
        sizes.push(2);
        opacities.push(0.15);
      }
    });

    Plotly.restyle(plotDiv, {
      'marker.size': sizes,
      'marker.opacity': opacities
    });
  } else {
    // Reset to defaults
    const sizes = classes.map(() => 5);
    const opacities = classes.map(() => 0.8);

    Plotly.restyle(plotDiv, {
      'marker.size': sizes,
      'marker.opacity': opacities
    });
  }
}
