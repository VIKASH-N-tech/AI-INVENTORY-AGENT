import React, { useState, useEffect } from "react";
import { 
  Warehouse as WhIcon, 
  MapPin, 
  Database, 
  CheckCircle,
  AlertTriangle,
  Grid3X3,
  Box,
  Layers,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Factory,
  Building2,
  Users,
  Activity,
  PlusCircle,
  Edit,
  TrendingUp,
  Map,
  Sparkles,
  Info,
  Trash2,
  Mail,
  Route,
  Navigation
} from "lucide-react";
import { Warehouse, Product } from "../types";
import SpatialLogistics from "./SpatialLogistics";

interface WarehouseSectionProps {
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
  capacity: number; // in Metric Tons or units
  utilized: number; // percentage
  employees: number;
  areas?: TNSubArea[];
}

function getDefaultAreasForDistrict(name: string): TNSubArea[] {
  switch (name) {
    case "Chennai":
      return [
        { id: "sub-ch-1", name: "Guindy Industrial Area", taluk: "Guindy", post: "Guindy SO (600032)", location: "13.0067° N, 80.2206° E", type: "SIDCO Estate", factoryName: "Guindy Precision Tools Unit A", status: "Active", capacity: 5000, employees: 300 },
        { id: "sub-ch-2", name: "Ambattur Complex", taluk: "Ambattur", post: "Ambattur IE (600058)", location: "13.1143° N, 80.1548° E", type: "SIDCO Estate", factoryName: "Ambattur Heavy Machineries", status: "Active", capacity: 8000, employees: 450 },
        { id: "sub-ch-3", name: "Ennore Coast", taluk: "Tiruvottiyur", post: "Ennore (600057)", location: "13.2161° N, 80.3247° E", type: "Local Cluster", factoryName: "Ennore Thermal Castings", status: "Active", capacity: 12000, employees: 670 }
      ];
    case "Coimbatore":
      return [
        { id: "sub-co-1", name: "Peelamedu Tech Zone", taluk: "Coimbatore North", post: "Peelamedu (641004)", location: "11.0294° N, 77.0145° E", type: "Private Tech Park", factoryName: "Peelamedu Smart Motors", status: "Active", capacity: 9000, employees: 500 },
        { id: "sub-co-2", name: "Kurichi SIDCO Estate", taluk: "Madukkarai", post: "Kurichi (641021)", location: "10.9525° N, 76.9692° E", type: "SIDCO Estate", factoryName: "Kurichi Casting Unit", status: "Active", capacity: 6000, employees: 310 },
        { id: "sub-co-3", name: "Sulur Engineering Cluster", taluk: "Sulur", post: "Sulur (641402)", location: "11.0267° N, 77.1245° E", type: "Local Cluster", factoryName: "Sulur Turbine Hub", status: "Active", capacity: 3000, employees: 140 }
      ];
    case "Madurai":
      return [
        { id: "sub-ma-1", name: "Kappalur Industrial Estate", taluk: "Thirumangalam", post: "Kappalur (625008)", location: "9.8522° N, 78.0356° E", type: "SIDCO Estate", factoryName: "Kappalur Polymers Ltd", status: "Active", capacity: 7000, employees: 350 },
        { id: "sub-ma-2", name: "Melur Agriculture Hub", taluk: "Melur", post: "Melur (625106)", location: "9.9922° N, 78.3308° E", type: "Local Cluster", factoryName: "Melur Agri Foods Unit B", status: "Active", capacity: 5000, employees: 230 }
      ];
    case "Tiruchirappalli (Trichy)":
      return [
        { id: "sub-tr-1", name: "Thuvakudi Heavy Industrial Area", taluk: "Thiruverumbur", post: "Thuvakudi (620015)", location: "10.7511° N, 78.7997° E", type: "SIPCOT Industrial Park", factoryName: "Thuvakudi Boilers & Alloys", status: "Active", capacity: 11000, employees: 520 },
        { id: "sub-tr-2", name: "Ariyamangalam Estate", taluk: "Trichy East", post: "Ariyamangalam (620010)", location: "10.8033° N, 78.7183° E", type: "SIDCO Estate", factoryName: "Ariyamangalam Forgings", status: "Active", capacity: 4000, employees: 200 }
      ];
    case "Salem":
      return [
        { id: "sub-sa-1", name: "Karuppur Industrial Complex", taluk: "Omalur", post: "Karuppur (636012)", location: "11.7139° N, 78.0933° E", type: "SIPCOT Industrial Park", factoryName: "Karuppur Steel Rolling Unit 1", status: "Active", capacity: 9000, employees: 410 },
        { id: "sub-sa-2", name: "Magnesite Mines Area", taluk: "Salem West", post: "Suramangalam (636005)", location: "11.6978° N, 78.1189° E", type: "Local Cluster", factoryName: "Salem Mineral Refining Hub", status: "Active", capacity: 5000, employees: 200 }
      ];
    case "Tiruppur":
      return [
        { id: "sub-ti-1", name: "Nethaji Apparel Park", taluk: "Tiruppur South", post: "Nethaji Apparel Park (641603)", location: "11.0833° N, 77.3822° E", type: "SEZ Zone", factoryName: "Nethaji Knitwear Factory", status: "Active", capacity: 15000, employees: 1200 },
        { id: "sub-ti-2", name: "Palladam Hi-Tech Weaving Park", taluk: "Palladam", post: "Palladam (641664)", location: "11.0022° N, 77.2917° E", type: "SIPCOT Industrial Park", factoryName: "Palladam Textile Loom Unit C", status: "Active", capacity: 7000, employees: 600 }
      ];
    case "Erode":
      return [
        { id: "sub-er-1", name: "Perundurai SIPCOT", taluk: "Perundurai", post: "Perundurai (638052)", location: "11.2725° N, 77.5856° E", type: "SIPCOT Industrial Park", factoryName: "Perundurai Bio-Chemicals", status: "Active", capacity: 11000, employees: 490 }
      ];
    case "Vellore":
      return [
        { id: "sub-ve-1", name: "Katpadi SIDCO", taluk: "Katpadi", post: "Katpadi (632007)", location: "12.9692° N, 79.1367° E", type: "SIDCO Estate", factoryName: "Katpadi Leather Tannery Unit 4", status: "Active", capacity: 10000, employees: 530 }
      ];
    case "Thoothukudi":
      return [
        { id: "sub-th-1", name: "Meelavittan SIPCOT", taluk: "Thoothukudi", post: "Meelavittan (628002)", location: "8.7961° N, 78.0944° E", type: "SIPCOT Industrial Park", factoryName: "Meelavittan Chemical Processing", status: "Active", capacity: 16000, employees: 680 }
      ];
    case "Tirunelveli":
      return [
        { id: "sub-tl-1", name: "Gangaikondan SIPCOT", taluk: "Tirunelveli", post: "Gangaikondan (627352)", location: "8.8475° N, 77.7428° E", type: "SIPCOT Industrial Park", factoryName: "Gangaikondan Cement Plant", status: "Active", capacity: 9500, employees: 340 }
      ];
    case "Kanyakumari":
      return [
        { id: "sub-ka-1", name: "Nagercoil Coir Cluster", taluk: "Agasteeswaram", post: "Nagercoil (629001)", location: "8.1833° N, 77.4119° E", type: "Local Cluster", factoryName: "Nagercoil Fiber Mills", status: "Active", capacity: 7000, employees: 220 }
      ];
    case "Thanjavur":
      return [
        { id: "sub-tj-1", name: "Sengipatti SIPCOT", taluk: "Budalur", post: "Sengipatti (613402)", location: "10.6694° N, 78.9181° E", type: "SIPCOT Industrial Park", factoryName: "Sengipatti Agro Hub", status: "Proposed", capacity: 5000, employees: 0 }
      ];
    case "Kanchipuram":
      return [
        { id: "sub-kc-1", name: "Sriperumbudur SIPCOT", taluk: "Sriperumbudur", post: "Sriperumbudur (602105)", location: "12.9722° N, 79.9444° E", type: "SIPCOT Industrial Park", factoryName: "Sriperumbudur Assembly Line 1", status: "Active", capacity: 13000, employees: 850 }
      ];
    case "Tiruvallur":
      return [
        { id: "sub-tv-1", name: "Oragadam Auto Hub", taluk: "Sriperumbudur", post: "Oragadam (602105)", location: "12.8761° N, 79.9575° E", type: "SIPCOT Industrial Park", factoryName: "Oragadam EV Plant", status: "Active", capacity: 17000, employees: 1100 }
      ];
    case "Cuddalore":
      return [
        { id: "sub-cu-1", name: "SIPCOT Cuddalore", taluk: "Cuddalore", post: "Kudikadu (607005)", location: "11.6961° N, 79.7547° E", type: "SIPCOT Industrial Park", factoryName: "Cuddalore Pharma Complex", status: "Active", capacity: 8500, employees: 90 }
      ];
    case "Nagapattinam":
      return [
        { id: "sub-na-1", name: "Nagore Marine Cluster", taluk: "Nagapattinam", post: "Nagore (611002)", location: "10.8225° N, 79.8458° E", type: "Local Cluster", factoryName: "Nagore Seafood Canning Unit A", status: "Proposed", capacity: 4500, employees: 0 }
      ];
    case "Tiruvarur":
      return [
        { id: "sub-tu-1", name: "Mannargudi Agro Area", taluk: "Mannargudi", post: "Mannargudi (614001)", location: "10.6619° N, 79.4397° E", type: "Local Cluster", factoryName: "Mannargudi Modern Rice Mill", status: "Proposed", capacity: 4000, employees: 0 }
      ];
    case "Karur":
      return [
        { id: "sub-kr-1", name: "Puliyur Cement & Textiles", taluk: "Karur", post: "Puliyur (639114)", location: "10.9575° N, 78.1394° E", type: "Local Cluster", factoryName: "Puliyur Loom Unit", status: "Active", capacity: 11500, employees: 420 }
      ];
    case "Namakkal":
      return [
        { id: "sub-nk-1", name: "Namakkal Poultry Zone", taluk: "Namakkal", post: "Namakkal (637001)", location: "11.2189° N, 78.1672° E", type: "Local Cluster", factoryName: "Namakkal Feed Mill", status: "Active", capacity: 10500, employees: 390 }
      ];
    case "Nilgiris":
      return [
        { id: "sub-ni-1", name: "Coonoor Tea Estates", taluk: "Coonoor", post: "Coonoor (643101)", location: "11.3531° N, 76.7958° E", type: "Local Cluster", factoryName: "Coonoor Tea Packaging", status: "Active", capacity: 6000, employees: 180 }
      ];
    case "Krishnagiri":
      return [
        { id: "sub-kg-1", name: "Hosur SIPCOT", taluk: "Hosur", post: "Hosur (635126)", location: "12.7408° N, 77.8253° E", type: "SIPCOT Industrial Park", factoryName: "Hosur Electronics Plant", status: "Active", capacity: 12500, employees: 500 }
      ];
    case "Dharmapuri":
      return [
        { id: "sub-dh-1", name: "Laligam Industrial Area", taluk: "Dharmapuri", post: "Laligam (636809)", location: "12.1158° N, 78.1561° E", type: "Local Cluster", factoryName: "Laligam Agro Processing", status: "Proposed", capacity: 4000, employees: 0 }
      ];
    case "Pudukkottai":
      return [
        { id: "sub-pu-1", name: "Mathur SIDCO", taluk: "Kulathur", post: "Mathur (622515)", location: "10.5989° N, 78.7408° E", type: "SIDCO Estate", factoryName: "Mathur Coir Unit", status: "Proposed", capacity: 3500, employees: 0 }
      ];
    case "Ramanathapuram":
      return [
        { id: "sub-ra-1", name: "Sayalkudi Salt Zone", taluk: "Kadaladi", post: "Sayalgudi (623120)", location: "9.2017° N, 78.4356° E", type: "Local Cluster", factoryName: "Sayalkudi Marine Refining", status: "Proposed", capacity: 3000, employees: 0 }
      ];
    case "Sivagangai":
      return [
        { id: "sub-si-1", name: "Karaikudi SIDCO", taluk: "Karaikudi", post: "Karaikudi (630001)", location: "10.0719° N, 78.7797° E", type: "SIDCO Estate", factoryName: "Karaikudi Graphite Unit", status: "Proposed", capacity: 5000, employees: 0 }
      ];
    case "Theni":
      return [
        { id: "sub-te-1", name: "Bodinayakanur Spices", taluk: "Bodinayakanur", post: "Bodinayakanur (625513)", location: "10.0103° N, 77.3514° E", type: "Local Cluster", factoryName: "Bodi Cardamom Sorting", status: "Proposed", capacity: 4500, employees: 0 }
      ];
    case "Virudhunagar":
      return [
        { id: "sub-vi-1", name: "Sivakasi Printing Estate", taluk: "Sivakasi", post: "Sivakasi (626123)", location: "9.4533° N, 77.7958° E", type: "Local Cluster", factoryName: "Sivakasi Offset Presses", status: "Active", capacity: 11000, employees: 480 }
      ];
    case "Dindigul":
      return [
        { id: "sub-di-1", name: "Dindigul Lock Cluster", taluk: "Dindigul East", post: "Dindigul (624001)", location: "10.3667° N, 77.9667° E", type: "Local Cluster", factoryName: "Dindigul Metallic Lock Works", status: "Active", capacity: 9000, employees: 320 }
      ];
    case "Tenkasi":
      return [
        { id: "sub-tk-1", name: "Shencottai Agro Area", taluk: "Shenkottai", post: "Shencottai (627809)", location: "8.9833° N, 77.2514° E", type: "Local Cluster", factoryName: "Shencottai Distilleries", status: "Proposed", capacity: 3500, employees: 0 }
      ];
    case "Ranipet":
      return [
        { id: "sub-rn-1", name: "Ranipet SIPCOT", taluk: "Walajah", post: "Ranipet (632403)", location: "12.9317° N, 79.3325° E", type: "SIPCOT Industrial Park", factoryName: "Ranipet Boiler Auxiliaries", status: "Active", capacity: 10000, employees: 410 }
      ];
    case "Tirupathur":
      return [
        { id: "sub-tp-1", name: "Vaniyambadi Leather Cluster", taluk: "Vaniyambadi", post: "Vaniyambadi (635751)", location: "12.6822° N, 78.6189° E", type: "Local Cluster", factoryName: "Vaniyambadi Tannery Unit", status: "Proposed", capacity: 4000, employees: 0 }
      ];
    case "Kallakurichi":
      return [
        { id: "sub-kl-1", name: "Ulundurpet SIDCO", taluk: "Ulundurpet", post: "Ulundurpet (606107)", location: "11.6853° N, 79.2881° E", type: "SIDCO Estate", factoryName: "Ulundurpet Flour Mills", status: "Proposed", capacity: 5000, employees: 0 }
      ];
    case "Chengalpattu":
      return [
        { id: "sub-cp-1", name: "Maraimalai Nagar SIPCOT", taluk: "Chengalpattu", post: "Maraimalai Nagar (603209)", location: "12.7933° N, 80.0247° E", type: "SIPCOT Industrial Park", factoryName: "MM Nagar Auto Ancillary Unit 12", status: "Active", capacity: 19000, employees: 1250 }
      ];
    case "Ariyalur":
      return [
        { id: "sub-ar-1", name: "Ariyalur Cement Area", taluk: "Ariyalur", post: "Ariyalur (621704)", location: "11.1397° N, 79.0714° E", type: "Local Cluster", factoryName: "Ariyalur Cement Factory Panel B", status: "Active", capacity: 15500, employees: 800 }
      ];
    case "Perambalur":
      return [
        { id: "sub-pe-1", name: "Elambalur SIDCO", taluk: "Perambalur", post: "Elambalur (621212)", location: "11.2589° N, 78.8683° E", type: "SIDCO Estate", factoryName: "Elambalur Starch Unit", status: "Proposed", capacity: 4000, employees: 0 }
      ];
    case "Villupuram":
      return [
        { id: "sub-vp-1", name: "Vandipalayam SIDCO", taluk: "Villupuram", post: "Vandipalayam (605602)", location: "11.9361° N, 79.4989° E", type: "SIDCO Estate", factoryName: "Vandipalayam Sugar Plant", status: "Proposed", capacity: 4500, employees: 0 }
      ];
    case "Mayiladuthurai":
      return [
        { id: "sub-my-1", name: "Sirkazhi Fishery Zone", taluk: "Sirkazhi", post: "Sirkazhi (609110)", location: "11.2389° N, 79.7331° E", type: "Local Cluster", factoryName: "Sirkazhi Cold Storage Complex", status: "Proposed", capacity: 3500, employees: 0 }
      ];
    case "Tiruvannamalai":
      return [
        { id: "sub-tm-1", name: "Cheyyar SIPCOT", taluk: "Cheyyar", post: "Cheyyar (604407)", location: "12.6581° N, 79.5414° E", type: "SIPCOT Industrial Park", factoryName: "Cheyyar Footwear SEZ Complex", status: "Active", capacity: 8500, employees: 290 }
      ];
    default:
      return [
        { id: `sub-custom-${name.toLowerCase().replace(/\s+/g, '-')}`, name: `${name} Industrial Zone`, taluk: `${name} North`, post: `${name} Head Post (600001)`, location: "13.0827° N, 80.2707° E", type: "Local Cluster", factoryName: `${name} General Assembly`, status: "Active", capacity: 5000, employees: 200 }
      ];
  }
}

export default function WarehouseSection({ warehouses, products, onTransferStock }: WarehouseSectionProps) {
  // Sub-navigation: Tamil Nadu Districts Network or Interactive Rack Layout
  const [subTab, setSubTab] = useState<"tamilnadu" | "spatial" | "rack">("spatial");

  // Rack visualizer state
  const [selectedWhId, setSelectedWhId] = useState<string>(warehouses[0]?.id || "wh-1");
  const [activeRackIdx, setActiveRackIdx] = useState<number>(0);
  const [activeShelfIdx, setActiveShelfIdx] = useState<number>(0);

  // Tamil Nadu Districts state
  const [districts, setDistricts] = useState<TamilNaduDistrict[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  // District editing modal state
  const [editingDistrict, setEditingDistrict] = useState<TamilNaduDistrict | null>(null);
  const [modalTab, setModalTab] = useState<"settings" | "areas">("settings");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New subarea form state
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaTaluk, setNewAreaTaluk] = useState("");
  const [newAreaPost, setNewAreaPost] = useState("");
  const [newAreaLocation, setNewAreaLocation] = useState("");
  const [newAreaType, setNewAreaType] = useState<TNSubArea["type"]>("SIPCOT Industrial Park");
  const [newAreaFactory, setNewAreaFactory] = useState("");
  const [newAreaStatus, setNewAreaStatus] = useState<TNSubArea["status"]>("Active");
  const [newAreaCapacity, setNewAreaCapacity] = useState(1000);
  const [newAreaEmployees, setNewAreaEmployees] = useState(50);

  // Default rich Tamil Nadu 38-district data
  const initialDistricts: TamilNaduDistrict[] = [
    { id: "tn-1", name: "Chennai", zone: "North", focus: "Automotive assembly & IT hardware", status: "Operational Hub", capacity: 25000, utilized: 78, employees: 1420 },
    { id: "tn-2", name: "Coimbatore", zone: "West", focus: "Industrial pumps & Textile machinery", status: "Operational Hub", capacity: 18000, utilized: 64, employees: 950 },
    { id: "tn-3", name: "Madurai", zone: "South", focus: "Technical textiles & Food processing", status: "Operational Hub", capacity: 12000, utilized: 45, employees: 580 },
    { id: "tn-4", name: "Tiruchirappalli (Trichy)", zone: "Central", focus: "Heavy boiler fabrication & Steel alloys", status: "Operational Hub", capacity: 15000, utilized: 58, employees: 720 },
    { id: "tn-5", name: "Salem", zone: "West", focus: "Specialty steel & Tapioca processing", status: "Operational Hub", capacity: 14000, utilized: 52, employees: 610 },
    { id: "tn-6", name: "Tiruppur", zone: "West", focus: "Knitwear & Garment export hub", status: "Partner Factory", capacity: 22000, utilized: 85, employees: 1800 },
    { id: "tn-7", name: "Erode", zone: "West", focus: "Turmeric processing & Powerloom weaving", status: "Partner Factory", capacity: 11000, utilized: 40, employees: 490 },
    { id: "tn-8", name: "Vellore", zone: "North", focus: "Finished leather goods & Footwear", status: "Operational Hub", capacity: 10000, utilized: 70, employees: 530 },
    { id: "tn-9", name: "Thoothukudi", zone: "South", focus: "Chemical processing & Port cargo handling", status: "Operational Hub", capacity: 16000, utilized: 60, employees: 680 },
    { id: "tn-10", name: "Tirunelveli", zone: "South", focus: "Cement mills & High-tech wind turbines", status: "Partner Factory", capacity: 9500, utilized: 38, employees: 340 },
    { id: "tn-11", name: "Kanyakumari", zone: "South", focus: "Seafood processing & Coir products", status: "Partner Factory", capacity: 7000, utilized: 30, employees: 220 },
    { id: "tn-12", name: "Thanjavur", zone: "East", focus: "Agro mills & Brass handicraft castings", status: "Planned Expansion", capacity: 5000, utilized: 0, employees: 0 },
    { id: "tn-13", name: "Kanchipuram", zone: "North", focus: "Silk weaving & Electronic components", status: "Operational Hub", capacity: 13000, utilized: 72, employees: 850 },
    { id: "tn-14", name: "Tiruvallur", zone: "North", focus: "Heavy commercial vehicles & Earthmovers", status: "Operational Hub", capacity: 17000, utilized: 65, employees: 1100 },
    { id: "tn-15", name: "Cuddalore", zone: "East", focus: "Industrial chemicals & Bulk drugs", status: "Under Audit", capacity: 8500, utilized: 15, employees: 90 },
    { id: "tn-16", name: "Nagapattinam", zone: "East", focus: "Seafood export & Petrochemical refining", status: "Planned Expansion", capacity: 4500, utilized: 0, employees: 0 },
    { id: "tn-17", name: "Tiruvarur", zone: "East", focus: "Rice milling & Organic fertilizer plants", status: "Planned Expansion", capacity: 4000, utilized: 0, employees: 0 },
    { id: "tn-18", name: "Karur", zone: "Central", focus: "Home textile furnishings & Bus body works", status: "Operational Hub", capacity: 11500, utilized: 50, employees: 420 },
    { id: "tn-19", name: "Namakkal", zone: "Central", focus: "Poultry feed & Truck bodybuilding fabrication", status: "Partner Factory", capacity: 10500, utilized: 48, employees: 390 },
    { id: "tn-20", name: "Nilgiris", zone: "West", focus: "Tea processing & Essential oils", status: "Partner Factory", capacity: 6000, utilized: 25, employees: 180 },
    { id: "tn-21", name: "Krishnagiri", zone: "West", focus: "Electronic hardware & Fruit pulp processing", status: "Operational Hub", capacity: 12500, utilized: 61, employees: 500 },
    { id: "tn-22", name: "Dharmapuri", zone: "West", focus: "Granite cutting & Horticulture value addition", status: "Planned Expansion", capacity: 4000, utilized: 0, employees: 0 },
    { id: "tn-23", name: "Pudukkottai", zone: "South", focus: "Coir geotextiles & Silica mining", status: "Planned Expansion", capacity: 3500, utilized: 0, employees: 0 },
    { id: "tn-24", name: "Ramanathapuram", zone: "South", focus: "Marine salt extraction & Dry fish cargo", status: "Planned Expansion", capacity: 3000, utilized: 0, employees: 0 },
    { id: "tn-25", name: "Sivagangai", zone: "South", focus: "Graphite refining & Agro-machinery parts", status: "Planned Expansion", capacity: 5000, utilized: 0, employees: 0 },
    { id: "tn-26", name: "Theni", zone: "South", focus: "Cardamom & Spice oil distillation", status: "Planned Expansion", capacity: 4500, utilized: 0, employees: 0 },
    { id: "tn-27", name: "Virudhunagar", zone: "South", focus: "Commercial fireworks & Offset printing presses", status: "Operational Hub", capacity: 11000, utilized: 55, employees: 480 },
    { id: "tn-28", name: "Dindigul", zone: "South", focus: "Industrial locks & Vegetable tanning leather", status: "Operational Hub", capacity: 9000, utilized: 42, employees: 320 },
    { id: "tn-29", name: "Tenkasi", zone: "South", focus: "Fruit processing & Woodwork furniture", status: "Planned Expansion", capacity: 3500, utilized: 0, employees: 0 },
    { id: "tn-30", name: "Ranipet", zone: "North", focus: "Boiler auxiliaries & Leather processing", status: "Operational Hub", capacity: 10000, utilized: 58, employees: 410 },
    { id: "tn-31", name: "Tirupathur", zone: "North", focus: "Sandalwood extraction & Agro oil mills", status: "Planned Expansion", capacity: 4000, utilized: 0, employees: 0 },
    { id: "tn-32", name: "Kallakurichi", zone: "Central", focus: "Cooperative sugar mills & Agro-processing", status: "Planned Expansion", capacity: 5000, utilized: 0, employees: 0 },
    { id: "tn-33", name: "Chengalpattu", zone: "North", focus: "Biotech labs, IT parks & Auto ancillary", status: "Operational Hub", capacity: 19000, utilized: 76, employees: 1250 },
    { id: "tn-34", name: "Ariyalur", zone: "Central", focus: "Cement manufacturing & Limestone mining", status: "Operational Hub", capacity: 15500, utilized: 68, employees: 800 },
    { id: "tn-35", name: "Perambalur", zone: "Central", focus: "Poultry integration & Maize starch plants", status: "Planned Expansion", capacity: 4000, utilized: 0, employees: 0 },
    { id: "tn-36", name: "Villupuram", zone: "Central", focus: "Sugar refining & Bio-ethanol fabrication", status: "Planned Expansion", capacity: 4500, utilized: 0, employees: 0 },
    { id: "tn-37", name: "Mayiladuthurai", zone: "East", focus: "Aquaculture freezing & Temple handicraft crafts", status: "Planned Expansion", capacity: 3500, utilized: 0, employees: 0 },
    { id: "tn-38", name: "Tiruvannamalai", zone: "North", focus: "Rice mill automation & Spiritual craft tools", status: "Operational Hub", capacity: 8500, utilized: 40, employees: 290 }
  ];

  // Load districts state from localStorage or initial value
  useEffect(() => {
    const saved = localStorage.getItem("aether_tn_districts");
    if (saved) {
      try {
        const parsed: TamilNaduDistrict[] = JSON.parse(saved);
        const upgraded = parsed.map(d => ({
          ...d,
          areas: d.areas && d.areas.length > 0 ? d.areas : getDefaultAreasForDistrict(d.name)
        }));
        setDistricts(upgraded);
      } catch (e) {
        const baselineWithAreas = initialDistricts.map(d => ({
          ...d,
          areas: getDefaultAreasForDistrict(d.name)
        }));
        setDistricts(baselineWithAreas);
      }
    } else {
      const baselineWithAreas = initialDistricts.map(d => ({
        ...d,
        areas: getDefaultAreasForDistrict(d.name)
      }));
      setDistricts(baselineWithAreas);
    }
  }, []);

  const saveDistrictsState = (updatedList: TamilNaduDistrict[]) => {
    setDistricts(updatedList);
    localStorage.setItem("aether_tn_districts", JSON.stringify(updatedList));
  };

  const handleOpenEdit = (d: TamilNaduDistrict) => {
    setEditingDistrict(d);
    setModalTab("settings");
    setNewAreaName("");
    setNewAreaTaluk("");
    setNewAreaPost("");
    setNewAreaLocation("");
    setNewAreaFactory("");
    setNewAreaCapacity(1000);
    setNewAreaEmployees(50);
  };

  const handleAddSubArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict || !newAreaName.trim()) return;

    const currentAreas = editingDistrict.areas || [];
    const newArea: TNSubArea = {
      id: `sub-${editingDistrict.id}-${Date.now()}`,
      name: newAreaName.trim(),
      taluk: newAreaTaluk.trim() || editingDistrict.name,
      post: newAreaPost.trim() || `${editingDistrict.name} Post`,
      location: newAreaLocation.trim() || "13.0827° N, 80.2707° E",
      type: newAreaType,
      factoryName: newAreaFactory.trim() || `${newAreaName} Unit`,
      status: newAreaStatus,
      capacity: Number(newAreaCapacity),
      employees: Number(newAreaEmployees)
    };

    const updatedAreas = [...currentAreas, newArea];

    // Compute updated totals for district
    const updatedCapacity = updatedAreas.reduce((sum, a) => sum + a.capacity, 0);
    const updatedEmployees = updatedAreas.reduce((sum, a) => sum + a.employees, 0);

    // Auto-update status
    let updatedStatus = editingDistrict.status;
    const hasActive = updatedAreas.some(a => a.status === "Active" || a.status === "Maintenance");
    const hasProposedOnly = updatedAreas.every(a => a.status === "Proposed" || a.status === "Under Construction");
    
    if (hasActive) {
      updatedStatus = "Operational Hub";
    } else if (hasProposedOnly) {
      updatedStatus = "Planned Expansion";
    }

    setEditingDistrict({
      ...editingDistrict,
      areas: updatedAreas,
      capacity: updatedCapacity,
      employees: updatedEmployees,
      status: updatedStatus
    });

    // Clear form
    setNewAreaName("");
    setNewAreaTaluk("");
    setNewAreaPost("");
    setNewAreaLocation("");
    setNewAreaFactory("");
    setNewAreaCapacity(1000);
    setNewAreaEmployees(50);
  };

  const handleRemoveSubArea = (subAreaId: string) => {
    if (!editingDistrict) return;
    const currentAreas = editingDistrict.areas || [];
    const updatedAreas = currentAreas.filter(a => a.id !== subAreaId);

    // Compute updated totals for district
    const updatedCapacity = updatedAreas.reduce((sum, a) => sum + a.capacity, 0);
    const updatedEmployees = updatedAreas.reduce((sum, a) => sum + a.employees, 0);

    let updatedStatus = editingDistrict.status;
    if (updatedAreas.length === 0) {
      updatedStatus = "Planned Expansion";
    } else {
      const hasActive = updatedAreas.some(a => a.status === "Active" || a.status === "Maintenance");
      const hasProposedOnly = updatedAreas.every(a => a.status === "Proposed" || a.status === "Under Construction");
      if (hasActive) {
        updatedStatus = "Operational Hub";
      } else if (hasProposedOnly) {
        updatedStatus = "Planned Expansion";
      }
    }

    setEditingDistrict({
      ...editingDistrict,
      areas: updatedAreas,
      capacity: updatedCapacity,
      employees: updatedEmployees,
      status: updatedStatus
    });
  };

  const handleUpdateDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict) return;

    const updated = districts.map((dist) => {
      if (dist.id === editingDistrict.id) {
        let autoEmp = editingDistrict.employees;
        let autoUtil = editingDistrict.utilized;
        if (editingDistrict.status === "Planned Expansion") {
          autoEmp = 0;
          autoUtil = 0;
        } else if (editingDistrict.status === "Operational Hub" && autoEmp === 0) {
          autoEmp = Math.round(editingDistrict.capacity * 0.05) || 100;
          autoUtil = 50;
        } else if (editingDistrict.status === "Partner Factory" && autoEmp === 0) {
          autoEmp = Math.round(editingDistrict.capacity * 0.04) || 80;
          autoUtil = 45;
        }
        return {
          ...editingDistrict,
          employees: autoEmp,
          utilized: autoUtil
        };
      }
      return dist;
    });

    saveDistrictsState(updated);
    showToast(`Successfully updated industrial hub and sub-areas for ${editingDistrict.name}!`);
    setEditingDistrict(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter & Search Logic for Districts
  const filteredDistricts = districts.filter((d) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      d.name.toLowerCase().includes(query) || 
      d.focus.toLowerCase().includes(query) || 
      d.zone.toLowerCase().includes(query) ||
      (d.areas || []).some(area => 
        area.name.toLowerCase().includes(query) ||
        area.factoryName.toLowerCase().includes(query) ||
        (area.taluk || "").toLowerCase().includes(query) ||
        (area.post || "").toLowerCase().includes(query)
      );
    
    const matchesZone = selectedZone === "All" || d.zone === selectedZone;
    const matchesStatus = selectedStatus === "All" || d.status === selectedStatus;

    return matchesSearch && matchesZone && matchesStatus;
  });

  // KPI Calculations
  const totalCapacity = districts.reduce((acc, d) => acc + d.capacity, 0);
  const activeHubsCount = districts.filter(d => d.status === "Operational Hub" || d.status === "Partner Factory").length;
  const underAuditCount = districts.filter(d => d.status === "Under Audit").length;
  const plannedExpansionCount = districts.filter(d => d.status === "Planned Expansion").length;
  const totalEmployees = districts.reduce((acc, d) => acc + d.employees, 0);

  // Flatten matching places/subareas for the Unified Master Directory Table
  const placesList = filteredDistricts.flatMap((district) => {
    return (district.areas || []).map((area) => ({
      ...area,
      districtId: district.id,
      districtName: district.name,
      districtZone: district.zone,
    }));
  });

  // Original Rack visualizer calculations
  const selectedWh = warehouses.find((w) => w.id === selectedWhId) || warehouses[0];
  const whProducts = products.filter((p) => p.warehouseId === selectedWhId);
  const getRackProduct = (rackIdx: number, shelfIdx: number) => {
    if (whProducts.length === 0) return null;
    const pIdx = (rackIdx * 3 + shelfIdx) % whProducts.length;
    const prod = whProducts[pIdx];
    const occupancyRatio = prod.stockLevel / (prod.minStock * 5);
    const occupancyPercent = Math.min(100, Math.round(occupancyRatio * 100));
    const status = occupancyPercent > 80 ? "full" : occupancyPercent > 20 ? "partial" : "empty";
    return {
      product: prod,
      occupancyPercent,
      status
    };
  };
  const selectedRackShelfContent = getRackProduct(activeRackIdx, activeShelfIdx);

  return (
    <div className="space-y-6" id="warehouse-module">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 border-2 border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xl animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Segment Navigation */}
      <div className="flex border-b border-slate-800 pb-px" id="warehouse-sub-navigation">
        <button
          onClick={() => setSubTab("tamilnadu")}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            subTab === "tamilnadu" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Tamil Nadu Industrial Grid ({districts.length} Districts)</span>
        </button>
        <button
          onClick={() => setSubTab("spatial")}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            subTab === "spatial" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Geographical Map & Route Optimization</span>
        </button>
        <button
          onClick={() => setSubTab("rack")}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            subTab === "rack" 
              ? "border-indigo-500 text-indigo-400" 
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Interactive Warehouse Rack Map</span>
        </button>
      </div>

      {subTab === "tamilnadu" && (
        <div className="space-y-6 animate-fade-in">
          {/* Tamil Nadu Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span>Tamil Nadu Multi-District Enterprise Hub</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                Real-time decentralization monitoring of manufacturing factories, partner units, and planned cold storage clusters across all 38 districts of Tamil Nadu, India.
              </p>
            </div>
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to reset all 38 districts to industrial baseline?")) {
                  const baselineWithAreas = initialDistricts.map(d => ({
                    ...d,
                    areas: getDefaultAreasForDistrict(d.name)
                  }));
                  saveDistrictsState(baselineWithAreas);
                  showToast("Baseline industrial configuration restored successfully!");
                }
              }}
              className="text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 px-3.5 py-2 rounded-lg cursor-pointer transition-all self-start md:self-auto"
            >
              Reset Industrial Baselines
            </button>
          </div>

          {/* Localized KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="tn-kpis">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Districts</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">38 / 38</span>
              <span className="text-[9px] text-emerald-400 font-medium block mt-1">100% Coverage</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Factories</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">{activeHubsCount}</span>
              <span className="text-[9px] text-indigo-400 font-medium block mt-1">Operational & Partners</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Under SLA Audit</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">{underAuditCount}</span>
              <span className="text-[9px] text-amber-400 font-medium block mt-1">Performance check</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Planned Clusters</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">{plannedExpansionCount}</span>
              <span className="text-[9px] text-slate-400 font-medium block mt-1">SIPCOT expansions</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Workforce</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">{totalEmployees.toLocaleString()}</span>
              <span className="text-[9px] text-indigo-400 font-medium block mt-1">Technical employees</span>
            </div>
          </div>

           {/* Search and Filters bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by District, Taluk, Post Office / PIN, or Factory..."
                className="w-full pl-10 pr-4 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  District Grid
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "table"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Places Directory
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters:</span>
              </div>
              
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Zones</option>
                <option value="North">North TN Zone</option>
                <option value="West">West TN Zone</option>
                <option value="South">South TN Zone</option>
                <option value="Central">Central TN Zone</option>
                <option value="East">East TN Zone</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Operational Hub">Operational Hub</option>
                <option value="Partner Factory">Partner Factory</option>
                <option value="Under Audit">Under Audit</option>
                <option value="Planned Expansion">Planned Expansion</option>
                <option value="Dormant">Dormant</option>
              </select>

              <span className="text-xs text-slate-500 font-mono font-semibold ml-auto md:ml-0">
                Found {filteredDistricts.length} districts
              </span>
            </div>
          </div>

          {/* Grid list of Districts vs Master Places Table */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="tn-districts-grid">
              {filteredDistricts.map((d) => {
                // Status Styling
                let badgeColor = "bg-slate-950 text-slate-400 border-slate-800";
                if (d.status === "Operational Hub") {
                  badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                } else if (d.status === "Partner Factory") {
                  badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                } else if (d.status === "Under Audit") {
                  badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                } else if (d.status === "Planned Expansion") {
                  badgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/20";
                }

                // Zone Colors
                let zoneTag = "North TN";
                let zoneColor = "text-red-400 bg-red-400/5 border-red-500/10";
                if (d.zone === "West") {
                  zoneTag = "West TN";
                  zoneColor = "text-amber-400 bg-amber-400/5 border-amber-500/10";
                } else if (d.zone === "South") {
                  zoneTag = "South TN";
                  zoneColor = "text-purple-400 bg-purple-400/5 border-purple-500/10";
                } else if (d.zone === "Central") {
                  zoneTag = "Central TN";
                  zoneColor = "text-emerald-400 bg-emerald-400/5 border-emerald-500/10";
                } else if (d.zone === "East") {
                  zoneTag = "East TN (Delta)";
                  zoneColor = "text-blue-400 bg-blue-400/5 border-blue-500/10";
                }

                return (
                  <div 
                    key={d.id} 
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all shadow-xs group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-200 text-sm group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{d.name}</span>
                          </h4>
                          <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 mt-1 inline-block ${zoneColor}`}>
                            {zoneTag}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold border rounded px-2 py-0.5 shrink-0 ${badgeColor}`}>
                          {d.status}
                        </span>
                      </div>

                      <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-850/60 text-xs">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide block">Industrial Segment</span>
                        <span className="text-slate-300 font-medium block mt-0.5 line-clamp-2 leading-relaxed">
                          {d.focus}
                        </span>
                      </div>

                      {/* Industrial Areas Section */}
                      <div className="bg-slate-950/20 border border-slate-850 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-1.5">
                          <span>Areas & Factories</span>
                          <span className="text-indigo-400">{(d.areas || []).length} Areas</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                          {(d.areas || []).slice(0, 3).map((area) => (
                            <span 
                              key={area.id} 
                              className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium"
                              title={`${area.factoryName} (${area.status})`}
                            >
                              {area.name}
                            </span>
                          ))}
                          {(d.areas || []).length > 3 && (
                            <span className="text-[9px] text-slate-500 font-medium self-center px-1">
                              +{d.areas.length - 3} more
                            </span>
                          )}
                          {(d.areas || []).length === 0 && (
                            <span className="text-[10px] text-slate-600 italic">No areas configured</span>
                          )}
                        </div>
                      </div>

                      {/* Operational Metrics (if active) */}
                      {d.status !== "Planned Expansion" ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500">Facility Capacity</span>
                            <span className="font-bold text-slate-300">{d.capacity.toLocaleString()} MT/yr</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Utilized Rate</span>
                              <span className="font-semibold">{d.utilized}%</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-slate-950 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  d.utilized > 80 ? "bg-red-500" : d.utilized > 50 ? "bg-indigo-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${d.utilized}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Workforce:</span>
                            <span className="font-semibold text-slate-400">{d.employees} employees</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/20 text-[11px] text-slate-500 font-medium">
                          Expansion Planned (SIPCOT Land Mapped)
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-850/80 pt-3 mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">ID: {d.id.toUpperCase()}</span>
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Manage Hub</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">Unified Tamil Nadu Places, Taluks & Factories Directory</h3>
                  <p className="text-xs text-slate-400">Comprehensive real-time directory listing each post, taluk, district, and core manufacturing factory.</p>
                </div>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded border border-indigo-500/20 font-bold">
                  {placesList.length} Registered Locations
                </span>
              </div>

              {placesList.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  <Info className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  No matching industrial places or factories found across Tamil Nadu. Try a different query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Taluk</th>
                        <th className="py-3 px-4">Place / Sub-Area</th>
                        <th className="py-3 px-4">Post Office / PIN</th>
                        <th className="py-3 px-4">Location / GPS</th>
                        <th className="py-3 px-4">Factory / Industrial Plant</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 font-mono">Metrics</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {placesList.map((place) => {
                        let typeColor = "bg-slate-850 text-indigo-400 border border-slate-800";
                        if (place.type === "SIPCOT Industrial Park") typeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
                        else if (place.type === "SIDCO Estate") typeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
                        else if (place.type === "SEZ Zone") typeColor = "bg-amber-500/10 text-amber-400 border-amber-500/25";

                        let statusColor = "text-emerald-400";
                        if (place.status === "Maintenance") statusColor = "text-amber-400";
                        else if (place.status === "Under Construction") statusColor = "text-sky-400";
                        else if (place.status === "Proposed") statusColor = "text-slate-500";

                        const districtObj = districts.find(d => d.id === place.districtId);

                        return (
                          <tr key={place.id} className="hover:bg-slate-950/40 transition-colors text-slate-300">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-100">{place.districtName}</span>
                              <span className="text-[9px] text-slate-500 block">{place.districtZone} Zone</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-200">
                              {place.taluk || place.districtName}
                            </td>
                            <td className="py-3 px-4 font-semibold text-indigo-300">
                              {place.name}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                              {place.post || "N/A"}
                            </td>
                            <td className="py-3 px-4">
                              {place.location ? (
                                <div className="flex items-center gap-1.5">
                                  <Map className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span className="font-mono text-slate-300 text-[11px] whitespace-nowrap">{place.location}</span>
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.location)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 transition-all ml-1 shrink-0"
                                    title="Open coordinates in Google Maps"
                                  >
                                    Map ↗
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">No GPS set</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-medium text-slate-100">
                                <Factory className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>{place.factoryName}</span>
                              </div>
                              <span className={`text-[9px] font-semibold mt-0.5 inline-block ${statusColor}`}>
                                ● {place.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold inline-block whitespace-nowrap ${typeColor}`}>
                                {place.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] space-y-0.5 whitespace-nowrap">
                              <div className="text-slate-300">Cap: {place.capacity.toLocaleString()} MT</div>
                              <div className="text-slate-500">Staff: {place.employees}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  if (districtObj) {
                                    handleOpenEdit(districtObj);
                                    setModalTab("areas");
                                  }
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-slate-950 hover:bg-slate-850 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-700 transition-all cursor-pointer inline-block"
                              >
                                Edit / Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* District Edit Modal */}
          {editingDistrict && (
            <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Factory className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm">Configure District Facility & Areas</h3>
                      <p className="text-xs text-slate-500">District: {editingDistrict.name} (Zone: {editingDistrict.zone} TN)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingDistrict(null)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold bg-slate-850/60 p-1.5 rounded-lg border border-slate-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Tab Navigation in Modal */}
                <div className="flex bg-slate-950/60 border-b border-slate-800 px-6 shrink-0">
                  <button
                    onClick={() => setModalTab("settings")}
                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      modalTab === "settings"
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    General Settings
                  </button>
                  <button
                    onClick={() => setModalTab("areas")}
                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalTab === "areas"
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>Industrial Areas & Factories</span>
                    <span className="bg-slate-850 text-[10px] text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
                      {(editingDistrict.areas || []).length}
                    </span>
                  </button>
                </div>

                {/* Modal Tab Content */}
                <div className="overflow-y-auto p-6 flex-1 space-y-4">
                  {modalTab === "settings" ? (
                    <form onSubmit={handleUpdateDistrict} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">District Name</label>
                        <input
                          type="text"
                          disabled
                          value={editingDistrict.name}
                          className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Facility Status</label>
                          <select
                            value={editingDistrict.status}
                            onChange={(e) => setEditingDistrict({
                              ...editingDistrict,
                              status: e.target.value as any
                            })}
                            className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Operational Hub">Operational Hub</option>
                            <option value="Partner Factory">Partner Factory</option>
                            <option value="Under Audit">Under SLA Audit</option>
                            <option value="Planned Expansion">Planned Expansion</option>
                            <option value="Dormant">Dormant</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Target Capacity (MT/year)</label>
                          <input
                            type="number"
                            min="0"
                            max="1000000"
                            value={editingDistrict.capacity}
                            onChange={(e) => setEditingDistrict({
                              ...editingDistrict,
                              capacity: Number(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Industrial Focus / Core Products</label>
                        <input
                          type="text"
                          required
                          value={editingDistrict.focus}
                          onChange={(e) => setEditingDistrict({
                            ...editingDistrict,
                            focus: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {editingDistrict.status !== "Planned Expansion" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Utilization Rate (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingDistrict.utilized}
                              onChange={(e) => setEditingDistrict({
                                ...editingDistrict,
                                utilized: Number(e.target.value)
                              })}
                              className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Workforce Strength</label>
                            <input
                              type="number"
                              min="0"
                              max="100000"
                              value={editingDistrict.employees}
                              onChange={(e) => setEditingDistrict({
                                ...editingDistrict,
                                employees: Number(e.target.value)
                              })}
                              className="w-full px-3 py-2 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}

                      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex gap-2">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Updating district settings changes the state-wide routing index used by the AI Demand Predictor. Capacity and workforce figures are aggregated from registered sub-areas.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingDistrict(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-400 border border-slate-800 rounded-lg hover:bg-slate-850 cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded-lg cursor-pointer transition-all shadow-sm"
                        >
                          Save Configuration
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Sub-Areas List */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Sub-Areas & Factory Units</h4>
                        
                        {(editingDistrict.areas || []).length === 0 ? (
                          <div className="text-center p-6 border border-dashed border-slate-850 rounded-xl bg-slate-950/20 text-xs text-slate-500">
                            No industrial sub-areas configured for this district. Add one below to begin.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {(editingDistrict.areas || []).map((area) => (
                              <div key={area.id} className="bg-slate-950/60 border border-slate-850/80 rounded-lg p-3 flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-200">{area.name}</span>
                                    <span className="text-[9px] bg-slate-850 text-indigo-400 border border-slate-800 px-1.5 py-0.2 rounded font-medium">{area.type}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                    <span className="flex items-center gap-1">
                                      <Factory className="w-3 h-3 text-slate-500" />
                                      <span>Plant: <strong className="text-slate-300">{area.factoryName}</strong></span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-indigo-400" />
                                      <span>Taluk: <strong className="text-slate-300">{area.taluk || editingDistrict.name}</strong></span>
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-emerald-400" />
                                      <span>Post Office: <strong className="text-slate-300">{area.post || "N/A"}</strong></span>
                                    </span>
                                    {area.location && (
                                      <span className="flex items-center gap-1">
                                        <Map className="w-3 h-3 text-sky-400" />
                                        <span>GPS: <strong className="text-slate-300">{area.location}</strong></span>
                                        <a 
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area.location)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-indigo-400 hover:underline hover:text-indigo-300 font-bold ml-0.5"
                                        >
                                          Map ↗
                                        </a>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-3 text-[9px] text-slate-500 font-mono pt-0.5">
                                    <span>Capacity: {area.capacity.toLocaleString()} MT/yr</span>
                                    <span>Workforce: {area.employees}</span>
                                    <span className={area.status === "Active" ? "text-emerald-400" : "text-amber-400"}>{area.status}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubArea(area.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer shrink-0"
                                  title="Remove Sub-Area"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Sub-Area Form */}
                      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <PlusCircle className="w-4 h-4 text-indigo-400" />
                          <span>Add New Industrial Sub-Area / Factory</span>
                        </h4>

                        <form onSubmit={handleAddSubArea} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Area Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Oragadam Zone B"
                                value={newAreaName}
                                onChange={(e) => setNewAreaName(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Area Type</label>
                              <select
                                value={newAreaType}
                                onChange={(e) => setNewAreaType(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="SIPCOT Industrial Park">SIPCOT Park</option>
                                <option value="SIDCO Estate">SIDCO Estate</option>
                                <option value="SEZ Zone">SEZ Zone</option>
                                <option value="Private Tech Park">Private Tech Park</option>
                                <option value="Local Cluster">Local Cluster</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Taluk</label>
                              <input
                                type="text"
                                placeholder={`e.g. ${editingDistrict.name} Taluk`}
                                value={newAreaTaluk}
                                onChange={(e) => setNewAreaTaluk(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Post Office / PIN Code</label>
                              <input
                                type="text"
                                placeholder="e.g. Post Office SO (602105)"
                                value={newAreaPost}
                                onChange={(e) => setNewAreaPost(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GPS Location / Coordinates</label>
                            <input
                              type="text"
                              placeholder="e.g. 13.0067° N, 80.2206° E"
                              value={newAreaLocation}
                              onChange={(e) => setNewAreaLocation(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Factory / Corporate Unit</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Hyundai Assembly Unit"
                                value={newAreaFactory}
                                onChange={(e) => setNewAreaFactory(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operating Status</label>
                              <select
                                value={newAreaStatus}
                                onChange={(e) => setNewAreaStatus(e.target.value as any)}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="Active">Active / Operational</option>
                                <option value="Maintenance">Under Maintenance</option>
                                <option value="Under Construction">Under Construction</option>
                                <option value="Proposed">Proposed Expansion</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Capacity (MT/yr)</label>
                              <input
                                type="number"
                                min="100"
                                max="100000"
                                required
                                value={newAreaCapacity}
                                onChange={(e) => setNewAreaCapacity(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Workforce Count</label>
                              <input
                                type="number"
                                min="5"
                                max="10000"
                                required
                                value={newAreaEmployees}
                                onChange={(e) => setNewAreaEmployees(Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 border border-slate-800 rounded-lg text-xs bg-slate-950 text-slate-200 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-1.5 mt-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-slate-100 font-bold rounded-lg text-xs transition-all cursor-pointer animate-pulse"
                          >
                            Add Area to District
                          </button>
                        </form>
                      </div>

                      <div className="pt-3 border-t border-slate-850 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">Totals: {editingDistrict.capacity.toLocaleString()} MT/yr | {editingDistrict.employees} workers</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = districts.map((dist) => dist.id === editingDistrict.id ? editingDistrict : dist);
                            saveDistrictsState(updated);
                            showToast(`Saved area registrations for ${editingDistrict.name}!`);
                            setEditingDistrict(null);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded-lg cursor-pointer transition-all shadow-sm"
                        >
                          Confirm & Save All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "spatial" && (
        <SpatialLogistics
          warehouses={warehouses}
          products={products}
          onTransferStock={onTransferStock}
        />
      )}

      {subTab === "rack" && (
        <div className="space-y-6 animate-fade-in">
          {/* Original Warehouse Hub Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="warehouse-selectors-grid">
            {warehouses.map((wh) => {
              const isActive = wh.id === selectedWhId;
              const whProductsCount = products.filter((p) => p.warehouseId === wh.id).length;
              const occupancyRate = Math.round((wh.usedSpace / wh.capacity) * 100);

              return (
                <button
                  key={wh.id}
                  id={`wh-select-btn-${wh.id}`}
                  onClick={() => {
                    setSelectedWhId(wh.id);
                    setActiveRackIdx(0);
                    setActiveShelfIdx(0);
                  }}
                  className={`p-5 rounded-xl border text-left transition-all hover:border-slate-700 cursor-pointer ${
                    isActive 
                      ? "bg-slate-900 border-indigo-500 text-slate-100 shadow-sm" 
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <WhIcon className={`w-5 h-5 ${isActive ? "text-indigo-400 animate-pulse" : "text-slate-500"}`} />
                      <div>
                        <h3 className="font-bold text-sm tracking-tight text-slate-200">{wh.name}</h3>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" /> {wh.location}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-600"}`} />
                  </div>

                  {/* Occupancy Indicator */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Rack Space Utilization</span>
                      <span className="font-bold text-slate-200">{occupancyRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-950">
                      <div 
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>{whProductsCount} Catalog SKUs</span>
                      <span>{wh.usedSpace.toLocaleString()} / {wh.capacity.toLocaleString()} m³</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual Rack Grid Matrix Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="warehouse-physical-layout">
            {/* The 2D Interactive Grid */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs" id="physical-map-grid-card">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Grid3X3 className="w-4.5 h-4.5 text-indigo-400" />
                    <span>Physical Rack Matrix Map - {selectedWh.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Click a coordinate slot to audit stored crates and shelf limits</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Full</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span> Partial</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-800 block"></span> Empty</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Generate columns of Racks, shelves vertically */}
                {Array.from({ length: selectedWh.rackLayout.racksCount }).map((_, rIdx) => (
                  <div key={rIdx} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aisle / Rack Row #{rIdx + 1}</span>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: selectedWh.rackLayout.shelvesPerRack }).map((_, sIdx) => {
                        const cell = getRackProduct(rIdx, sIdx);
                        const isSelected = activeRackIdx === rIdx && activeShelfIdx === sIdx;
                        
                        let bgStyle = "bg-slate-950 hover:bg-slate-800 text-slate-500 border-slate-850";
                        if (cell) {
                          if (cell.status === "full") {
                            bgStyle = isSelected 
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-1 ring-indigo-500" 
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30";
                          } else if (cell.status === "partial") {
                            bgStyle = isSelected 
                              ? "bg-amber-500 text-white border-amber-600 shadow-md ring-1 ring-indigo-500" 
                              : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 border-amber-500/30";
                          } else {
                            bgStyle = isSelected
                              ? "bg-slate-800 text-white border-slate-700 shadow-md ring-1 ring-indigo-500"
                              : "bg-slate-950 text-slate-400 hover:bg-slate-800 border-slate-850";
                          }
                        }

                        return (
                          <button
                            key={sIdx}
                            id={`rack-${rIdx}-shelf-${sIdx}-slot`}
                            onClick={() => {
                              setActiveRackIdx(rIdx);
                              setActiveShelfIdx(sIdx);
                            }}
                            className={`py-3.5 px-2 rounded-lg border text-center font-mono text-xs font-bold transition-all cursor-pointer ${bgStyle}`}
                          >
                            <span className="block text-[9px] font-semibold opacity-70">R{rIdx+1}-S{sIdx+1}</span>
                            {cell ? (
                              <span className="text-xs font-bold mt-0.5 block">{cell.occupancyPercent}%</span>
                            ) : (
                              <span className="text-xs font-bold mt-0.5 block">0%</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Slot Inspector Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-300 flex flex-col justify-between h-full min-h-[400px]" id="slot-inspector-panel">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                  <Box className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">Physical Slot Audit</h3>
                    <span className="text-xs text-slate-500 font-mono">Coordinate: Rack {activeRackIdx + 1}, Tier Shelf {activeShelfIdx + 1}</span>
                  </div>
                </div>

                {selectedRackShelfContent && selectedRackShelfContent.product ? (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Audited Item</span>
                      <span className="text-base font-bold text-slate-100 mt-1 block">
                        {selectedRackShelfContent.product.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                        SKU: {selectedRackShelfContent.product.sku}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Crates Filled</span>
                        <span className="text-lg font-bold text-slate-200 mt-1 block">
                          {selectedRackShelfContent.product.stockLevel.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{selectedRackShelfContent.product.unit}</span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-center">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Density Limit</span>
                        <span className="text-lg font-bold text-slate-200 mt-1 block">
                          {selectedRackShelfContent.product.minStock * 5}
                        </span>
                        <span className="text-[9px] text-slate-400 block">max capacity</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Weight Volumetric Load</span>
                        <span className="font-bold">{selectedRackShelfContent.occupancyPercent}% Occupied</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-950">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            selectedRackShelfContent.status === "full" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${selectedRackShelfContent.occupancyPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Logistics Route</span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Section Area:</span>
                        <span className="font-semibold text-slate-200">Zone A - Heavy Components</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vendor Code:</span>
                        <span className="font-semibold text-slate-200">SUP-{selectedRackShelfContent.product.supplierId.split("-")[1] || "01"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <Layers className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs">No crates currently mapped to this coordinate bin</p>
                    <span className="text-[10px] mt-1 block text-slate-600">Click neighboring cells to inspect stocked rows</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>SENSORS NOMINAL • PRESSURE OK</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
