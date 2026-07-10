import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { 
  MapPin, 
  Truck, 
  ArrowRight, 
  Navigation, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  Coins, 
  Leaf, 
  Package, 
  CheckCircle, 
  Play, 
  Clock, 
  Compass, 
  Layers, 
  ShieldAlert,
  Map as MapIcon,
  Factory
} from "lucide-react";
import { Warehouse, Product } from "../types";

interface SpatialLogisticsProps {
  warehouses: Warehouse[];
  products: Product[];
  onTransferStock: (productId: string, fromWh: string, toWh: string, qty: number) => Promise<boolean>;
}

interface TNSubArea {
  id: string;
  name: string;
  taluk?: string;
  post?: string;
  location?: string;
  type: "SIPCOT Industrial Park" | "SIDCO Estate" | "SEZ Zone" | "Private Tech Park" | "Local Cluster";
  factoryName: string;
  status: "Active" | "Maintenance" | "Under Construction" | "Proposed";
  capacity: number; // MT/year
  employees: number;
}

interface TamilNaduDistrict {
  id: string;
  name: string;
  zone: "North" | "West" | "South" | "Central" | "East";
  focus: string;
  status: "Operational Hub" | "Partner Factory" | "Under Audit" | "Planned Expansion" | "Dormant";
  capacity: number;
  utilized: number;
  employees: number;
  areas?: TNSubArea[];
}

// Coordinate Mapping Centers of Tamil Nadu Districts
const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Coimbatore": { lat: 11.0168, lng: 76.9558 },
  "Madurai": { lat: 9.9252, lng: 78.1198 },
  "Tiruchirappalli (Trichy)": { lat: 10.7905, lng: 78.7047 },
  "Salem": { lat: 11.6643, lng: 78.1460 },
  "Tiruppur": { lat: 11.1085, lng: 77.3411 },
  "Erode": { lat: 11.3410, lng: 77.7172 },
  "Vellore": { lat: 12.9165, lng: 79.1325 },
  "Thoothukudi": { lat: 8.7642, lng: 78.1348 },
  "Tirunelveli": { lat: 8.7139, lng: 77.7567 },
  "Kanyakumari": { lat: 8.0883, lng: 77.5385 },
  "Thanjavur": { lat: 10.7870, lng: 79.1378 },
  "Kanchipuram": { lat: 12.8342, lng: 79.7036 },
  "Tiruvallur": { lat: 13.1383, lng: 79.9122 },
  "Cuddalore": { lat: 11.7480, lng: 79.7714 },
  "Nagapattinam": { lat: 10.7672, lng: 79.8444 },
  "Tiruvarur": { lat: 10.7402, lng: 79.6417 },
  "Karur": { lat: 10.9601, lng: 78.0766 },
  "Namakkal": { lat: 11.2189, lng: 78.1672 },
  "Nilgiris": { lat: 11.4102, lng: 76.6950 },
  "Krishnagiri": { lat: 12.5186, lng: 78.2137 },
  "Dharmapuri": { lat: 12.1211, lng: 78.1582 },
  "Pudukkottai": { lat: 10.3797, lng: 78.8206 },
  "Ramanathapuram": { lat: 9.3639, lng: 78.8394 },
  "Sivagangai": { lat: 9.8433, lng: 78.4809 },
  "Theni": { lat: 10.0104, lng: 77.4777 },
  "Virudhunagar": { lat: 9.5680, lng: 77.9624 },
  "Dindigul": { lat: 10.3673, lng: 77.9806 },
  "Tenkasi": { lat: 8.9591, lng: 77.3150 },
  "Ranipet": { lat: 12.9272, lng: 79.3328 },
  "Tirupathur": { lat: 12.4933, lng: 78.5678 },
  "Kallakurichi": { lat: 11.7381, lng: 78.9614 },
  "Chengalpattu": { lat: 12.6916, lng: 79.9754 },
  "Ariyalur": { lat: 11.1401, lng: 79.0786 },
  "Perambalur": { lat: 11.2342, lng: 78.8821 },
  "Villupuram": { lat: 11.9401, lng: 79.4861 },
  "Mayiladuthurai": { lat: 11.1017, lng: 79.5786 },
  "Tiruvannamalai": { lat: 12.2253, lng: 79.0747 }
};

interface Connection {
  to: string;
  highway: string;
  distance: number; // in km
}

// High-fidelity highway transit network inside Tamil Nadu
const ADJACENCY_LIST: Record<string, Connection[]> = {
  "Chennai": [
    { to: "Kanchipuram", highway: "NH 48", distance: 75 },
    { to: "Tiruvallur", highway: "NH 716", distance: 45 },
    { to: "Chengalpattu", highway: "NH 32", distance: 55 }
  ],
  "Kanchipuram": [
    { to: "Chennai", highway: "NH 48", distance: 75 },
    { to: "Ranipet", highway: "NH 48", distance: 40 },
    { to: "Chengalpattu", highway: "SH 58", distance: 35 },
    { to: "Tiruvannamalai", highway: "SH 116", distance: 110 }
  ],
  "Tiruvallur": [
    { to: "Chennai", highway: "NH 716", distance: 45 },
    { to: "Ranipet", highway: "NH 40", distance: 65 }
  ],
  "Ranipet": [
    { to: "Kanchipuram", highway: "NH 48", distance: 40 },
    { to: "Tiruvallur", highway: "NH 40", distance: 65 },
    { to: "Vellore", highway: "NH 48", distance: 25 },
    { to: "Tiruvannamalai", highway: "SH 4", distance: 80 }
  ],
  "Vellore": [
    { to: "Ranipet", highway: "NH 48", distance: 25 },
    { to: "Tirupathur", highway: "NH 179A", distance: 85 },
    { to: "Tiruvannamalai", highway: "NH 38", distance: 85 },
    { to: "Krishnagiri", highway: "NH 48", distance: 115 }
  ],
  "Tirupathur": [
    { to: "Vellore", highway: "NH 179A", distance: 85 },
    { to: "Krishnagiri", highway: "SH 18", distance: 50 },
    { to: "Tiruvannamalai", highway: "SH 11", distance: 70 },
    { to: "Dharmapuri", highway: "SH 120", distance: 65 }
  ],
  "Krishnagiri": [
    { to: "Vellore", highway: "NH 48", distance: 115 },
    { to: "Tirupathur", highway: "SH 18", distance: 50 },
    { to: "Dharmapuri", highway: "NH 44", distance: 45 }
  ],
  "Dharmapuri": [
    { to: "Krishnagiri", highway: "NH 44", distance: 45 },
    { to: "Tirupathur", highway: "SH 120", distance: 65 },
    { to: "Salem", highway: "NH 44", distance: 60 }
  ],
  "Salem": [
    { to: "Dharmapuri", highway: "NH 44", distance: 60 },
    { to: "Erode", highway: "NH 544", distance: 65 },
    { to: "Namakkal", highway: "NH 44", distance: 55 },
    { to: "Kallakurichi", highway: "NH 79", distance: 75 }
  ],
  "Erode": [
    { to: "Salem", highway: "NH 544", distance: 65 },
    { to: "Coimbatore", highway: "NH 544", distance: 90 },
    { to: "Tiruppur", highway: "NH 544", distance: 55 },
    { to: "Karur", highway: "SH 84", distance: 65 }
  ],
  "Coimbatore": [
    { to: "Erode", highway: "NH 544", distance: 90 },
    { to: "Tiruppur", highway: "NH 544", distance: 50 },
    { to: "Nilgiris", highway: "NH 181", distance: 85 },
    { to: "Dindigul", highway: "NH 209", distance: 150 },
    { to: "Theni", highway: "SH 37", distance: 160 }
  ],
  "Tiruppur": [
    { to: "Coimbatore", highway: "NH 544", distance: 50 },
    { to: "Erode", highway: "NH 544", distance: 55 },
    { to: "Karur", highway: "SH 21", distance: 75 },
    { to: "Dindigul", highway: "SH 37", distance: 105 }
  ],
  "Nilgiris": [
    { to: "Coimbatore", highway: "NH 181", distance: 85 }
  ],
  "Chengalpattu": [
    { to: "Chennai", highway: "NH 32", distance: 55 },
    { to: "Kanchipuram", highway: "SH 58", distance: 35 },
    { to: "Villupuram", highway: "NH 32", distance: 105 }
  ],
  "Villupuram": [
    { to: "Chengalpattu", highway: "NH 32", distance: 105 },
    { to: "Tiruvannamalai", highway: "NH 38", distance: 60 },
    { to: "Kallakurichi", highway: "NH 79", distance: 70 },
    { to: "Cuddalore", highway: "NH 45A", distance: 45 }
  ],
  "Tiruvannamalai": [
    { to: "Kanchipuram", highway: "SH 116", distance: 110 },
    { to: "Ranipet", highway: "SH 4", distance: 80 },
    { to: "Vellore", highway: "NH 38", distance: 85 },
    { to: "Tirupathur", highway: "SH 11", distance: 70 },
    { to: "Villupuram", highway: "NH 38", distance: 60 },
    { to: "Kallakurichi", highway: "SH 5", distance: 80 }
  ],
  "Kallakurichi": [
    { to: "Salem", highway: "NH 79", distance: 75 },
    { to: "Villupuram", highway: "NH 79", distance: 70 },
    { to: "Tiruvannamalai", highway: "SH 5", distance: 80 },
    { to: "Perambalur", highway: "SH 134", distance: 65 }
  ],
  "Cuddalore": [
    { to: "Villupuram", highway: "NH 45A", distance: 45 },
    { to: "Mayiladuthurai", highway: "ECR / NH 32", distance: 60 },
    { to: "Ariyalur", highway: "SH 140", distance: 80 }
  ],
  "Mayiladuthurai": [
    { to: "Cuddalore", highway: "ECR / NH 32", distance: 60 },
    { to: "Nagapattinam", highway: "ECR", distance: 50 },
    { to: "Tiruvarur", highway: "SH 23", distance: 40 }
  ],
  "Nagapattinam": [
    { to: "Mayiladuthurai", highway: "ECR", distance: 50 },
    { to: "Tiruvarur", highway: "NH 83", distance: 25 },
    { to: "Thanjavur", highway: "NH 83", distance: 80 }
  ],
  "Tiruvarur": [
    { to: "Mayiladuthurai", highway: "SH 23", distance: 40 },
    { to: "Nagapattinam", highway: "NH 83", distance: 25 },
    { to: "Thanjavur", highway: "NH 83", distance: 55 }
  ],
  "Thanjavur": [
    { to: "Tiruvarur", highway: "NH 83", distance: 55 },
    { to: "Nagapattinam", highway: "NH 83", distance: 80 },
    { to: "Pudukkottai", highway: "NH 36", distance: 55 },
    { to: "Tiruchirappalli (Trichy)", highway: "NH 83", distance: 50 }
  ],
  "Tiruchirappalli (Trichy)": [
    { to: "Thanjavur", highway: "NH 83", distance: 50 },
    { to: "Pudukkottai", highway: "NH 336", distance: 55 },
    { to: "Ariyalur", highway: "NH 81", distance: 65 },
    { to: "Perambalur", highway: "NH 45", distance: 60 },
    { to: "Karur", highway: "NH 81", distance: 80 },
    { to: "Dindigul", highway: "NH 45", distance: 100 }
  ],
  "Ariyalur": [
    { to: "Tiruchirappalli (Trichy)", highway: "NH 81", distance: 65 },
    { to: "Perambalur", highway: "SH 142", distance: 30 },
    { to: "Cuddalore", highway: "SH 140", distance: 80 }
  ],
  "Perambalur": [
    { to: "Tiruchirappalli (Trichy)", highway: "NH 45", distance: 60 },
    { to: "Ariyalur", highway: "SH 142", distance: 30 },
    { to: "Kallakurichi", highway: "SH 134", distance: 65 }
  ],
  "Namakkal": [
    { to: "Salem", highway: "NH 44", distance: 55 },
    { to: "Karur", highway: "NH 44", distance: 45 },
    { to: "Tiruchirappalli (Trichy)", highway: "SH 25", distance: 85 }
  ],
  "Karur": [
    { to: "Namakkal", highway: "NH 44", distance: 45 },
    { to: "Erode", highway: "SH 84", distance: 65 },
    { to: "Tiruppur", highway: "SH 21", distance: 75 },
    { to: "Tiruchirappalli (Trichy)", highway: "NH 81", distance: 80 },
    { to: "Dindigul", highway: "NH 813", distance: 75 }
  ],
  "Pudukkottai": [
    { to: "Tiruchirappalli (Trichy)", highway: "NH 336", distance: 55 },
    { to: "Thanjavur", highway: "NH 36", distance: 55 },
    { to: "Sivagangai", highway: "SH 118", distance: 75 },
    { to: "Ramanathapuram", highway: "NH 536", distance: 125 }
  ],
  "Dindigul": [
    { to: "Tiruchirappalli (Trichy)", highway: "NH 45", distance: 100 },
    { to: "Karur", highway: "NH 813", distance: 75 },
    { to: "Tiruppur", highway: "SH 37", distance: 105 },
    { to: "Coimbatore", highway: "NH 209", distance: 150 },
    { to: "Madurai", highway: "NH 44", distance: 65 },
    { to: "Theni", highway: "NH 45", distance: 75 }
  ],
  "Theni": [
    { to: "Coimbatore", highway: "SH 37", distance: 160 },
    { to: "Dindigul", highway: "NH 45", distance: 75 },
    { to: "Madurai", highway: "NH 85", distance: 75 }
  ],
  "Madurai": [
    { to: "Dindigul", highway: "NH 44", distance: 65 },
    { to: "Theni", highway: "NH 85", distance: 75 },
    { to: "Sivagangai", highway: "NH 85", distance: 45 },
    { to: "Virudhunagar", highway: "NH 44", distance: 50 },
    { to: "Ramanathapuram", highway: "NH 87", distance: 115 }
  ],
  "Sivagangai": [
    { to: "Madurai", highway: "NH 85", distance: 45 },
    { to: "Pudukkottai", highway: "SH 118", distance: 75 },
    { to: "Ramanathapuram", highway: "NH 536", distance: 85 }
  ],
  "Ramanathapuram": [
    { to: "Madurai", highway: "NH 87", distance: 115 },
    { to: "Sivagangai", highway: "NH 536", distance: 85 },
    { to: "Pudukkottai", highway: "NH 536", distance: 125 },
    { to: "Thoothukudi", highway: "ECR", distance: 120 }
  ],
  "Virudhunagar": [
    { to: "Madurai", highway: "NH 44", distance: 50 },
    { to: "Tenkasi", highway: "NH 744", distance: 85 },
    { to: "Tirunelveli", highway: "NH 44", distance: 85 },
    { to: "Thoothukudi", highway: "NH 138", distance: 90 }
  ],
  "Tenkasi": [
    { to: "Virudhunagar", highway: "NH 744", distance: 85 },
    { to: "Tirunelveli", highway: "NH 744", distance: 50 }
  ],
  "Tirunelveli": [
    { to: "Virudhunagar", highway: "NH 44", distance: 85 },
    { to: "Tenkasi", highway: "NH 744", distance: 50 },
    { to: "Thoothukudi", highway: "NH 138", distance: 50 },
    { to: "Kanyakumari", highway: "NH 44", distance: 80 }
  ],
  "Thoothukudi": [
    { to: "Ramanathapuram", highway: "ECR", distance: 120 },
    { to: "Virudhunagar", highway: "NH 138", distance: 90 },
    { to: "Tirunelveli", highway: "NH 138", distance: 50 },
    { to: "Kanyakumari", highway: "ECR", distance: 115 }
  ],
  "Kanyakumari": [
    { to: "Tirunelveli", highway: "NH 44", distance: 80 },
    { to: "Thoothukudi", highway: "ECR", distance: 115 }
  ]
};

// Approximated boundary outline of Tamil Nadu for drawing the coastal & state boundary base
const BOUNDARY_COORDINATES = [
  { lat: 8.0883, lng: 77.5385 }, // Kanyakumari
  { lat: 8.35, lng: 77.95 },
  { lat: 8.7642, lng: 78.1348 }, // Thoothukudi coast
  { lat: 9.15, lng: 78.90 },     // Ramanathapuram
  { lat: 9.28, lng: 79.30 },     // Rameswaram
  { lat: 9.45, lng: 79.15 },
  { lat: 9.80, lng: 79.00 },     // Palk Strait
  { lat: 10.20, lng: 79.20 },    // Thanjavur coast
  { lat: 10.35, lng: 79.38 },
  { lat: 10.7672, lng: 79.8444 }, // Nagapattinam
  { lat: 11.15, lng: 79.85 },     // Mayiladuthurai
  { lat: 11.45, lng: 79.78 },
  { lat: 11.7480, lng: 79.7714 }, // Cuddalore
  { lat: 11.9300, lng: 79.8200 }, // Puducherry
  { lat: 12.25, lng: 80.02 },
  { lat: 12.50, lng: 80.15 },     // Chengalpattu
  { lat: 13.0827, lng: 80.2707 }, // Chennai
  { lat: 13.50, lng: 80.15 },     // Pulicat Lake
  { lat: 13.45, lng: 79.85 },     // Tiruvallur North
  { lat: 13.20, lng: 79.55 },     // Ranipet North
  { lat: 12.90, lng: 78.90 },     // Vellore West
  { lat: 12.65, lng: 78.45 },     // Tirupathur West
  { lat: 12.75, lng: 77.8253 },   // Krishnagiri/Hosur
  { lat: 12.35, lng: 77.65 },
  { lat: 12.1211, lng: 77.75 },   // Dharmapuri West
  { lat: 11.85, lng: 77.40 },     // Erode North
  { lat: 11.60, lng: 77.10 },     // Nilgiris
  { lat: 11.4102, lng: 76.45 },   // Nilgiris West
  { lat: 11.00, lng: 76.65 },     // Coimbatore West
  { lat: 10.50, lng: 77.15 },     // Tiruppur West
  { lat: 10.0104, lng: 77.20 },   // Theni West
  { lat: 9.60, lng: 77.35 },      // Virudhunagar West
  { lat: 8.9591, lng: 77.20 },    // Tenkasi West
  { lat: 8.55, lng: 77.35 },      // Tirunelveli West
  { lat: 8.15, lng: 77.40 }       // Kanyakumari West
];

// Dijkstra shortest-path router
function computeDijkstraRoute(source: string, target: string) {
  if (source === target) {
    return { path: [source], distance: 0, segments: [] };
  }

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const highwaysUsed: Record<string, string> = {};
  const unvisited = new Set<string>();

  Object.keys(DISTRICT_CENTERS).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  });
  distances[source] = 0;

  while (unvisited.size > 0) {
    let minNode: string | null = null;
    let minDist = Infinity;
    unvisited.forEach(node => {
      if (distances[node] < minDist) {
        minDist = distances[node];
        minNode = node;
      }
    });

    if (minNode === null || minNode === target) {
      break;
    }

    unvisited.delete(minNode);

    const neighbors = ADJACENCY_LIST[minNode] || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.to)) continue;
      const alt = distances[minNode] + edge.distance;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = minNode;
        highwaysUsed[edge.to] = edge.highway;
      }
    }
  }

  if (distances[target] === Infinity) {
    return null; // unreachable in current layout (should not happen with our connected graph)
  }

  const path: string[] = [];
  let curr: string | null = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  const segments: { from: string, to: string, highway: string, distance: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i+1];
    const edge = ADJACENCY_LIST[from]?.find(e => e.to === to);
    segments.push({
      from,
      to,
      highway: edge?.highway || highwaysUsed[to] || "NH Corridor Link",
      distance: edge?.distance || 50
    });
  }

  return {
    path,
    distance: distances[target],
    segments
  };
}

export default function SpatialLogistics({ warehouses, products, onTransferStock }: SpatialLogisticsProps) {
  // Navigation states
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 620, height: 580 });

  // Route selector states
  const [sourceDistrict, setSourceDistrict] = useState<string>("Chennai");
  const [targetDistrict, setTargetDistrict] = useState<string>("Coimbatore");
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [transferQty, setTransferQty] = useState<number>(50);

  // Hover states for tooltips
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  // Processing indicators
  const [isExecuting, setIsExecuting] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Read districts list
  const [districts, setDistricts] = useState<TamilNaduDistrict[]>([]);

  // Load latest districts to get local statuses, etc.
  useEffect(() => {
    const saved = localStorage.getItem("aether_tn_districts");
    if (saved) {
      try {
        setDistricts(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Update product selection when products load
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Handle ResizeObserver
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = entry.contentRect.width || 620;
          const h = Math.max(540, Math.min(650, w * 0.95)); // proportional scaling
          setDimensions({ width: w, height: h });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Set up timer for path pulsing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 40);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Map limits
  const minLat = 7.8;
  const maxLat = 13.6;
  const minLng = 76.0;
  const maxLng = 80.6;

  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  // Project geographic coordinates to SVG pixels
  const project = useMemo(() => {
    return (lat: number, lng: number): [number, number] => {
      const paddingX = Math.max(30, dimensions.width * 0.08);
      const paddingY = Math.max(30, dimensions.height * 0.08);

      // Longitude maps to X (West to East)
      const x = paddingX + ((lng - minLng) / lngDiff) * (dimensions.width - 2 * paddingX);
      // Latitude maps to Y (South to North, but Y goes down in SVG)
      const y = dimensions.height - paddingY - ((lat - minLat) / latDiff) * (dimensions.height - 2 * paddingY);

      return [x, y];
    };
  }, [dimensions, latDiff, lngDiff]);

  // Compute optimized route
  const optimizedRoute = useMemo(() => {
    return computeDijkstraRoute(sourceDistrict, targetDistrict);
  }, [sourceDistrict, targetDistrict]);

  // Selectable list of districts in alphabetical order
  const alphabeticalDistricts = useMemo(() => {
    return Object.keys(DISTRICT_CENTERS).sort();
  }, []);

  // Calculate logistics metrics
  const metrics = useMemo(() => {
    if (!optimizedRoute) return null;
    const distanceKm = optimizedRoute.distance;
    
    // Core parameters:
    // Regular transit rate: ₹45/km
    // Optimized transit rate (NH corridors system bundle): ₹32/km (28% savings)
    const baseCost = distanceKm * 45;
    const optimizedCost = distanceKm * 32.5;
    const savingsCost = baseCost - optimizedCost;

    // Time: standard logistics avg truck 55 km/hr
    const transitTimeHrs = distanceKm / 55;

    // CO2: Heavy diesel logistics carrier produces ~0.15kg CO2 per Ton-km
    // Moving 10 tons of payload average.
    // Eco-routing and fuel efficiency saves ~20% carbon emissions.
    const standardCO2 = distanceKm * 1.5; // kg CO2
    const optimizedCO2 = distanceKm * 1.15; // kg CO2
    const co2Reduction = standardCO2 - optimizedCO2;

    return {
      distance: distanceKm,
      cost: optimizedCost,
      savings: savingsCost,
      time: transitTimeHrs,
      co2: optimizedCO2,
      co2Savings: co2Reduction
    };
  }, [optimizedRoute]);

  // Link selected warehouse nodes for physical database operations
  const sourceWarehouse = useMemo(() => {
    if (sourceDistrict === "Chennai") return warehouses.find(w => w.id === "wh-1") || warehouses[0];
    if (sourceDistrict === "Coimbatore") return warehouses.find(w => w.id === "wh-2") || warehouses[1];
    if (sourceDistrict === "Madurai") return warehouses.find(w => w.id === "wh-3") || warehouses[2];
    return null;
  }, [sourceDistrict, warehouses]);

  const targetWarehouse = useMemo(() => {
    if (targetDistrict === "Chennai") return warehouses.find(w => w.id === "wh-1") || warehouses[0];
    if (targetDistrict === "Coimbatore") return warehouses.find(w => w.id === "wh-2") || warehouses[1];
    if (targetDistrict === "Madurai") return warehouses.find(w => w.id === "wh-3") || warehouses[2];
    return null;
  }, [targetDistrict, warehouses]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const sourceStockLevel = useMemo(() => {
    if (!selectedProduct) return 0;
    if (sourceWarehouse) {
      // Find matching product in this warehouse
      const matches = products.find(p => p.sku === selectedProduct.sku && p.warehouseId === sourceWarehouse.id);
      return matches ? matches.stockLevel : 0;
    }
    // Simulation fallback for other districts
    return Math.floor((selectedProduct.stockLevel + 120) / 2);
  }, [selectedProduct, sourceWarehouse, products]);

  // Execute actual transfer operation in db
  const handleExecuteTransfer = async () => {
    if (!selectedProduct) {
      alert("Please select a product to transfer.");
      return;
    }

    if (sourceDistrict === targetDistrict) {
      alert("Source and Destination hubs must be distinct.");
      return;
    }

    if (!sourceWarehouse || !targetWarehouse) {
      alert(`Simulation Route: This suggests an efficient highway route for stock transit between ${sourceDistrict} and ${targetDistrict}.\n\nOfficial inventory database stock transfers require both endpoints to be registered AETHER active hubs (Chennai Mega Hub, Coimbatore Depot, or Madurai Transit Center).`);
      return;
    }

    if (transferQty <= 0) {
      alert("Please enter a valid transfer quantity.");
      return;
    }

    if (sourceStockLevel < transferQty) {
      alert(`Insufficient stock. ${sourceWarehouse.name} only holds ${sourceStockLevel} ${selectedProduct.unit} of ${selectedProduct.name} (SKU: ${selectedProduct.sku}). Requested: ${transferQty}.`);
      return;
    }

    setIsExecuting(true);
    try {
      const success = await onTransferStock(selectedProduct.id, sourceWarehouse.id, targetWarehouse.id, transferQty);
      if (success) {
        alert(`Stock Transfer Executed Successfully via Optimized Route!\n\nTransit Highway Corridor: ${optimizedRoute?.segments.map(s => s.highway).filter((v, i, a) => a.indexOf(v) === i).join(" ➔ ") || "NH Corridor"}\nDistance: ${metrics?.distance.toFixed(0)} km\nCarrier Cargo Cost: ₹${metrics?.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}\nEstimated Delivery: ${metrics?.time.toFixed(1)} hours.`);
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during route stock dispatch.");
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate SVG elements for the map using D3 projection
  const mapSvgContent = useMemo(() => {
    // Generate coastline path
    const lineGenerator = d3.line<{ lat: number; lng: number }>()
      .x(d => project(d.lat, d.lng)[0])
      .y(d => project(d.lat, d.lng)[1])
      .curve(d3.curveCardinalClosed.tension(0.18));

    const pathData = lineGenerator(BOUNDARY_COORDINATES) || "";

    // Draw connecting NH network lines
    const nhSegments: React.ReactNode[] = [];
    Object.entries(ADJACENCY_LIST).forEach(([fromName, links]) => {
      const fromCoord = DISTRICT_CENTERS[fromName];
      if (!fromCoord) return;
      const [fx, fy] = project(fromCoord.lat, fromCoord.lng);

      links.forEach((link) => {
        const toCoord = DISTRICT_CENTERS[link.to];
        if (!toCoord) return;
        const [tx, ty] = project(toCoord.lat, toCoord.lng);

        // Keep a unique key
        const key = `nh-${fromName}-${link.to}`;
        nhSegments.push(
          <line
            key={key}
            x1={fx}
            y1={fy}
            x2={tx}
            y2={ty}
            stroke="#1e293b"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />
        );
      });
    });

    // Draw optimized active route path highlighting
    const activeRouteSegments: React.ReactNode[] = [];
    if (optimizedRoute && optimizedRoute.path.length > 1) {
      for (let i = 0; i < optimizedRoute.path.length - 1; i++) {
        const fromNode = optimizedRoute.path[i];
        const toNode = optimizedRoute.path[i+1];
        const fromC = DISTRICT_CENTERS[fromNode];
        const toC = DISTRICT_CENTERS[toNode];
        
        if (fromC && toC) {
          const [fx, fy] = project(fromC.lat, fromC.lng);
          const [tx, ty] = project(toC.lat, toC.lng);
          
          activeRouteSegments.push(
            <g key={`route-segment-${fromNode}-${toNode}`}>
              {/* Outer neon pulse line */}
              <line
                x1={fx}
                y1={fy}
                x2={tx}
                y2={ty}
                stroke="#6366f1"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.35"
                className="blur-xs"
              />
              {/* Core active path line */}
              <line
                x1={fx}
                y1={fy}
                x2={tx}
                y2={ty}
                stroke="#818cf8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        }
      }
    }

    // Dynamic flowing particle along the active optimized route
    let flowCircle: React.ReactNode | null = null;
    if (optimizedRoute && optimizedRoute.path.length > 1) {
      const totalPoints = optimizedRoute.path.length;
      // Interpolate along the path segments based on current animation step
      const stepValue = animationStep % 40; // 0 to 39
      const segmentProgress = stepValue / 40; // 0.0 to 1.0

      const segmentIdx = Math.floor(segmentProgress * (totalPoints - 1));
      const nextSegmentIdx = segmentIdx + 1;
      const ratio = (segmentProgress * (totalPoints - 1)) - segmentIdx;

      const fromNode = optimizedRoute.path[segmentIdx];
      const toNode = optimizedRoute.path[nextSegmentIdx];
      
      const fromC = DISTRICT_CENTERS[fromNode];
      const toC = DISTRICT_CENTERS[toNode];

      if (fromC && toC) {
        const [fx, fy] = project(fromC.lat, fromC.lng);
        const [tx, ty] = project(toC.lat, toC.lng);
        
        // Linear interpolation of coordinate positions
        const px = fx + (tx - fx) * ratio;
        const py = fy + (ty - fy) * ratio;

        flowCircle = (
          <g>
            <circle
              cx={px}
              cy={py}
              r="7"
              fill="#818cf8"
              opacity="0.4"
              className="animate-ping"
            />
            <circle
              cx={px}
              cy={py}
              r="4.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="shadow-md"
            />
          </g>
        );
      }
    }

    // Render district hub nodes
    const districtNodes = Object.entries(DISTRICT_CENTERS).map(([name, coord]) => {
      const [x, y] = project(coord.lat, coord.lng);
      
      // Determine if it is a major warehouse
      const isWarehouse = name === "Chennai" || name === "Coimbatore" || name === "Madurai";
      const isSelectedSource = name === sourceDistrict;
      const isSelectedTarget = name === targetDistrict;
      const isPartOfRoute = optimizedRoute?.path.includes(name);

      // Node size based on capacity importance
      let r = 5.5;
      let fillClass = "fill-slate-800 stroke-slate-700";
      
      if (isWarehouse) {
        r = 8.5;
        fillClass = "fill-emerald-500 stroke-slate-900";
      } else if (isPartOfRoute) {
        fillClass = "fill-indigo-400 stroke-slate-950";
      }

      if (isSelectedSource) {
        r = 10.5;
        fillClass = "fill-indigo-500 stroke-white";
      } else if (isSelectedTarget) {
        r = 10.5;
        fillClass = "fill-emerald-500 stroke-white animate-pulse";
      }

      return (
        <g 
          key={`node-${name}`}
          className="cursor-pointer group"
          onClick={() => {
            // Click to toggle source/destination
            if (name === sourceDistrict) return;
            setTargetDistrict(name);
          }}
          onMouseEnter={(e) => {
            setHoveredDistrict(name);
            setTooltipPosition({ x: x, y: y - 12 });
          }}
          onMouseLeave={() => {
            setHoveredDistrict(null);
          }}
        >
          {/* Subtle surrounding glow hover element */}
          <circle
            cx={x}
            cy={y}
            r={r + 4}
            className="fill-transparent group-hover:fill-indigo-500/10 transition-all"
          />
          <circle
            cx={x}
            cy={y}
            r={r}
            className={`transition-all duration-300 ${fillClass}`}
            strokeWidth={isSelectedSource || isSelectedTarget ? 2.5 : 1.5}
          />
          {/* Node label for major warehouses or selected items */}
          {(isWarehouse || isSelectedSource || isSelectedTarget || isPartOfRoute) && (
            <text
              x={x}
              y={y - r - 3}
              textAnchor="middle"
              className={`font-sans font-bold text-[9px] pointer-events-none fill-slate-300 select-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)]`}
            >
              {name === "Tiruchirappalli (Trichy)" ? "Trichy" : name}
            </text>
          )}
        </g>
      );
    });

    return {
      pathData,
      nhSegments,
      activeRouteSegments,
      flowCircle,
      districtNodes
    };
  }, [project, optimizedRoute, sourceDistrict, targetDistrict, animationStep]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="spatial-logistics-pane">
      
      {/* 1. D3 GEOGRAPHICAL MAP CONTAINER (8 Cols) */}
      <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4" id="d3-map-card">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Tamil Nadu Spatial Logistics Controller</span>
            </h3>
            <p className="text-xs text-slate-400">D3 geographic projection visualizing warehouses, manufacturing plants, and active supply corridors</p>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>NH Network Base</span>
          </div>
        </div>

        {/* Map Stage Area */}
        <div 
          ref={containerRef} 
          className="w-full h-[520px] bg-slate-950 border border-slate-950 rounded-xl overflow-hidden relative shadow-inner flex items-center justify-center select-none"
        >
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className="block"
          >
            {/* SVG Definitions for shadows/glows */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Graticule Grid */}
            <rect width={dimensions.width} height={dimensions.height} fill="url(#grid-pattern)" opacity="0.05" />

            {/* Tamil Nadu State Outline Poly */}
            <path
              d={mapSvgContent.pathData}
              fill="#1e1b4b"
              fillOpacity="0.25"
              stroke="#4338ca"
              strokeWidth="2.2"
              className="transition-all duration-300"
            />

            {/* Light Grid Highway Connections */}
            <g id="nh-corridors-group">
              {mapSvgContent.nhSegments}
            </g>

            {/* Active Optimized Path */}
            <g id="active-route-group">
              {mapSvgContent.activeRouteSegments}
            </g>

            {/* Animated Flow Cargo Particle */}
            {mapSvgContent.flowCircle}

            {/* Nodes group representing the districts */}
            <g id="district-nodes-group">
              {mapSvgContent.districtNodes}
            </g>
          </svg>

          {/* Map Compass Rose Decoration */}
          <div className="absolute bottom-4 right-4 text-slate-600 flex flex-col items-center gap-1 opacity-60">
            <Compass className="w-8 h-8 animate-spin-slow text-indigo-500/30" style={{ animationDuration: "25s" }} />
            <span className="text-[8px] font-mono tracking-widest font-bold">GRID NORTH</span>
          </div>

          {/* Tooltip Overlay */}
          {hoveredDistrict && (
            <div 
              className="absolute z-30 pointer-events-none bg-slate-950/95 border border-slate-800 text-slate-100 p-3 rounded-lg shadow-xl text-[10px] space-y-1.5 backdrop-blur-md"
              style={{ 
                left: `${tooltipPosition.x}px`, 
                top: `${tooltipPosition.y}px`,
                transform: "translate(-50%, -100%)",
                width: "210px"
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="font-bold text-slate-200 text-xs">{hoveredDistrict}</span>
                { (hoveredDistrict === "Chennai" || hoveredDistrict === "Coimbatore" || hoveredDistrict === "Madurai") ? (
                  <span className="text-[8px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">ACTIVE HUB</span>
                ) : (
                  <span className="text-[8px] font-bold uppercase text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded">FACTORY HUB</span>
                )}
              </div>
              
              <div className="space-y-1 text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="text-slate-300 font-semibold">{DISTRICT_CENTERS[hoveredDistrict]?.lat.toFixed(4)}°N, {DISTRICT_CENTERS[hoveredDistrict]?.lng.toFixed(4)}°E</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Index:</span>
                  <span className="text-slate-300 font-semibold">
                    {districts.find(d => d.name === hoveredDistrict)?.capacity.toLocaleString() || "7,500"} MT/yr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-slate-200 font-semibold">
                    {districts.find(d => d.name === hoveredDistrict)?.status || "Operational Hub"}
                  </span>
                </div>
                <div className="text-[9px] text-indigo-300 font-sans mt-1.5 pt-1.5 border-t border-slate-900 leading-relaxed italic">
                  ❝ {districts.find(d => d.name === hoveredDistrict)?.focus || "Integrated electronics & assembly plant."} ❞
                </div>
              </div>
            </div>
          )}

          {/* Quick Selection Guide Hint */}
          <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl max-w-[280px] pointer-events-none text-[10px] space-y-1 text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Interactive Controls</span>
            </div>
            <p>• Click any district node to set it as <span className="text-emerald-400 font-bold">Destination</span>.</p>
            <p>• Major active warehouses shown in <span className="text-emerald-500 font-bold">large green</span> hubs.</p>
            <p>• Dash-lines represent the Tamil Nadu Highway backbone.</p>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: ROUTE CONFIGURATOR & TRANSIT METRICS (5 Cols) */}
      <div className="xl:col-span-5 flex flex-col gap-6" id="route-panel">
        
        {/* Transit Configuration form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5" id="route-selector-card">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Smart Route Configurator</span>
            </h3>
            <p className="text-xs text-slate-500">Select industrial endpoints to calculate cost-optimized highway routing</p>
          </div>

          <div className="space-y-4">
            {/* Source selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stock Source (From)</label>
                <select
                  value={sourceDistrict}
                  onChange={(e) => setSourceDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {alphabeticalDistricts.map((name) => (
                    <option key={`src-${name}`} value={name}>
                      {name} { (name === "Chennai" || name === "Coimbatore" || name === "Madurai") ? "★" : "" }
                    </option>
                  ))}
                </select>
                {sourceWarehouse ? (
                  <span className="text-[9px] text-emerald-600 font-semibold mt-1 block">✓ Active Hub: {sourceWarehouse.name}</span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium mt-1 block">Mfg Hub (SLA Partner)</span>
                )}
              </div>

              {/* Destination selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stock Destination (To)</label>
                <select
                  value={targetDistrict}
                  onChange={(e) => setTargetDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {alphabeticalDistricts.map((name) => (
                    <option key={`dest-${name}`} value={name}>
                      {name} { (name === "Chennai" || name === "Coimbatore" || name === "Madurai") ? "★" : "" }
                    </option>
                  ))}
                </select>
                {targetWarehouse ? (
                  <span className="text-[9px] text-emerald-600 font-semibold mt-1 block">✓ Active Hub: {targetWarehouse.name}</span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium mt-1 block">Mfg Hub (SLA Partner)</span>
                )}
              </div>
            </div>

            {/* Product selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Product SKU to Transfer</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {products.map((p) => (
                  <option key={`prod-sel-${p.id}`} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Source Stock: <strong className="text-slate-700">{sourceStockLevel} {selectedProduct.unit}</strong></span>
                  <span>Unit Cost: <b>₹{selectedProduct.cost.toLocaleString()}</b></span>
                </div>
              )}
            </div>

            {/* Transfer Qty */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity to Transfer</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={sourceStockLevel > 0 ? sourceStockLevel : 100}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none"
                />
                <span className="text-slate-400 text-xs font-bold font-mono uppercase">{selectedProduct?.unit || "units"}</span>
              </div>
            </div>

            {/* Action dispatch button */}
            <button
              onClick={handleExecuteTransfer}
              disabled={isExecuting || sourceDistrict === targetDistrict}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceDistrict === targetDistrict
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-100 shadow-sm"
              }`}
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Cargo Dispatch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Dispatch Optimized Stock Transfer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Route Metrics & Highway Corridors */}
        {metrics && optimizedRoute && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-300 space-y-4 shadow-md" id="metrics-card">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Transit Computation Model</h4>
                <p className="text-[10px] text-slate-400 font-mono">Dijkstra Shortest Path Solver Active</p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Optimized</span>
            </div>

            {/* Core figures list */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">Total Distance</span>
                <span className="text-sm font-bold text-indigo-400 mt-1 block">{metrics.distance.toFixed(0)} km</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">Est. Time</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">
                  {metrics.time >= 1 ? `${metrics.time.toFixed(1)} hrs` : `${Math.round(metrics.time * 60)} mins`}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase block">Consolidated Cost</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">₹{metrics.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Savings & Environment Benefits */}
            <div className="grid grid-cols-2 gap-3 text-[10px] pt-1">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg flex items-start gap-2">
                <Coins className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-emerald-400 font-bold block">₹{metrics.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} Saved</span>
                  <p className="text-slate-400 text-[9px]">Saving 28% logistics costs by bundling NH networks.</p>
                </div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg flex items-start gap-2">
                <Leaf className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-emerald-400 font-bold block">-{metrics.co2Savings.toFixed(1)} kg CO₂</span>
                  <p className="text-slate-400 text-[9px]">Carbon footprint reduction via eco-routing paths.</p>
                </div>
              </div>
            </div>

            {/* Highway Steps Trace */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">Calculated Highway Corridors Route</span>
              
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 text-[11px]">
                {optimizedRoute.segments.map((segment, idx) => (
                  <div key={`seg-${idx}`} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/30 px-3 py-1.5 rounded text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200 font-sans font-semibold">{segment.from}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-200 font-sans font-semibold">{segment.to}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-indigo-400 font-bold block text-[10px]">{segment.highway}</span>
                      <span className="text-[9px] text-slate-500">{segment.distance} km</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning if simulation */}
            {(!sourceWarehouse || !targetWarehouse) && (
              <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg flex items-start gap-2 text-[10px] text-amber-400/90 leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Transit Simulation Mode:</strong> Official database inventory moves can only be executed between verified warehouse nodes (Chennai, Coimbatore, and Madurai). Other locations are resolved for transit cost forecasts.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
