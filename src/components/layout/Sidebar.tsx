import React, { useMemo, useRef, useState } from "react";
import {
  Search,
  Star,
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Tv,
  Clock,
  Check,
  PanelLeftClose,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Device, DeviceCategory } from "../../types/device";

interface SidebarProps {
  isOpen: boolean;
  devices: Device[];
  activeDeviceIds: string[];
  recentDeviceIds: string[];
  viewMode: "single" | "multi";
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onSelectDevice: (device: Device) => void;
  onToggleFavorite: (deviceId: string) => void;
  onOpenAddModal: () => void;
  onEditDevice: (device: Device) => void;
  onDeleteDevice: (deviceId: string) => void;
  onImportDevices: (devices: Device[]) => void;
  onExportDevices: () => void;
}

type FilterTab = "All" | DeviceCategory | "Favorites" | "Recent";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Smartphone", label: "Phones" },
  { id: "Tablet", label: "Tablets" },
  { id: "Laptop", label: "Laptops" },
  { id: "Desktop", label: "Desktop" },
  { id: "Smart TV", label: "TVs" },
  { id: "Favorites", label: "Starred" },
  { id: "Recent", label: "Recent" },
];

function CategoryIcon({ category }: { category: DeviceCategory }) {
  switch (category) {
    case "Smartphone":
      return <Smartphone className="h-3.5 w-3.5 shrink-0" />;
    case "Tablet":
      return <Tablet className="h-3.5 w-3.5 shrink-0" />;
    case "Laptop":
      return <Laptop className="h-3.5 w-3.5 shrink-0" />;
    case "Desktop":
      return <Monitor className="h-3.5 w-3.5 shrink-0" />;
    case "Smart TV":
      return <Tv className="h-3.5 w-3.5 shrink-0" />;
  }
}

function DeviceOutlineThumb({ device }: { device: Device }) {
  const isPhone = device.category === "Smartphone";
  const isTablet = device.category === "Tablet";
  const isLaptop = device.category === "Laptop";
  if (isPhone) {
    return (
      <div className="relative mx-auto flex h-10 w-5 flex-col items-center justify-between rounded-[4px] border-[1.5px] border-current py-0.5">
        <div className="h-0.5 w-1.5 rounded-full bg-current opacity-60" />
        <div className="h-0.5 w-2 rounded-full bg-current opacity-50" />
      </div>
    );
  }
  if (isTablet) {
    return (
      <div className="relative mx-auto flex h-9 w-7 flex-col items-center justify-between rounded-[4px] border-[1.5px] border-current py-0.5">
        <div className="h-0.5 w-0.5 rounded-full bg-current opacity-60" />
      </div>
    );
  }
  if (isLaptop) {
    return (
      <div className="mx-auto flex flex-col items-center">
        <div className="h-6 w-9 rounded-t-[3px] border-[1.5px] border-current" />
        <div className="h-1 w-11 rounded-b-sm bg-current opacity-80" />
      </div>
    );
  }
  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="h-6 w-10 rounded-[2px] border-[1.5px] border-current" />
      <div className="h-1 w-3 bg-current opacity-60" />
      <div className="h-0.5 w-6 rounded-full bg-current opacity-80" />
    </div>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  devices,
  activeDeviceIds,
  recentDeviceIds,
  viewMode,
  searchInputRef,
  onClose,
  onSelectDevice,
  onToggleFavorite,
  onOpenAddModal,
  onEditDevice,
  onDeleteDevice,
  onImportDevices,
  onExportDevices,
}) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brands = useMemo(() => {
    const set = new Set(devices.map((d) => d.brand));
    return ["All", ...Array.from(set).sort()];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    let list = devices;

    if (activeTab === "Favorites") {
      list = list.filter((d) => d.isFavorite);
    } else if (activeTab === "Recent") {
      const recentSet = new Map(recentDeviceIds.map((id, idx) => [id, idx]));
      list = list
        .filter((d) => recentSet.has(d.id))
        .sort((a, b) => (recentSet.get(a.id) ?? 99) - (recentSet.get(b.id) ?? 99));
    } else if (activeTab !== "All") {
      list = list.filter((d) => d.category === activeTab);
    }

    if (selectedBrand !== "All") {
      list = list.filter((d) => d.brand === selectedBrand);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          `${d.viewport.width}x${d.viewport.height}`.includes(q)
      );
    }

    return list;
  }, [devices, activeTab, selectedBrand, search, recentDeviceIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (d): d is Device =>
              d &&
              typeof d.name === "string" &&
              typeof d.brand === "string" &&
              typeof d.viewport?.width === "number" &&
              typeof d.viewport?.height === "number"
          );
          if (valid.length > 0) {
            onImportDevices(valid);
          }
        }
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <aside
      aria-hidden={!isOpen}
      className={`sidebar-drawer h-full shrink-0 overflow-hidden border-r bg-zinc-50 dark:bg-zinc-950 ${
        isOpen
          ? "w-72 translate-x-0 border-zinc-200 opacity-100 dark:border-zinc-800/90"
          : "pointer-events-none w-0 -translate-x-5 border-transparent opacity-0"
      }`}
    >
      <div className="flex h-full w-72 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-3.5 py-3 dark:border-zinc-800/90">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Device Library ({devices.length})
          </h2>
          <p className="text-[11px] text-zinc-500">
            {viewMode === "multi"
              ? "Click to toggle (up to 6)"
              : "100% Free • No Pro Locks"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setLayoutMode((m) => (m === "list" ? "grid" : "list"))
            }
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title={
              layoutMode === "list"
                ? "Switch to Visual Device Grid"
                : "Switch to Compact List"
            }
          >
            {layoutMode === "list" ? (
              <LayoutGrid className="h-3.5 w-3.5" />
            ) : (
              <List className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Itel, Tecno, iPhone... (Ctrl+K)"
            className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 px-3 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition active:scale-95 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-zinc-200/70 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {tab.id === "Recent" && <Clock className="mr-1 inline h-3 w-3" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Brand filter chips */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-3 pb-2.5 dark:border-zinc-800/90">
        {brands.map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(brand)}
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition ${
              selectedBrand === brand
                ? "border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700"
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Device list or Visual Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredDevices.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            No matching devices found.
          </div>
        ) : layoutMode === "grid" ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredDevices.map((device) => {
              const isActive = activeDeviceIds.includes(device.id);
              return (
                <div
                  key={device.id}
                  onClick={() => onSelectDevice(device)}
                  className={`group relative flex cursor-pointer flex-col items-center rounded-xl border p-2.5 text-center transition duration-150 hover:-translate-y-0.5 active:scale-[0.98] ${
                    isActive
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-sm dark:text-indigo-300"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(device.id);
                    }}
                    className={`absolute right-1.5 top-1.5 rounded p-0.5 transition ${
                      device.isFavorite
                        ? "text-amber-400"
                        : "text-zinc-400 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        device.isFavorite ? "fill-amber-400" : ""
                      }`}
                    />
                  </button>
                  <div className="mb-2 mt-1">
                    <DeviceOutlineThumb device={device} />
                  </div>
                  <div className="w-full truncate text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                    {device.name}
                  </div>
                  <div className="font-mono text-[9px] text-zinc-500">
                    {device.viewport.width}×{device.viewport.height}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDevices.map((device) => {
              const isActive = activeDeviceIds.includes(device.id);
              return (
                <div
                  key={device.id}
                  onClick={() => onSelectDevice(device)}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl border px-2.5 py-2 transition active:scale-[0.99] ${
                    isActive
                      ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                      : "border-transparent hover:border-zinc-200 hover:bg-white dark:hover:border-zinc-800 dark:hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {isActive ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <CategoryIcon category={device.category} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {device.name}
                        </span>
                        {device.isCustom && (
                          <span className="rounded bg-emerald-500/15 px-1 text-[9px] font-semibold text-emerald-500">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                        <span>
                          {device.viewport.width}×{device.viewport.height}
                        </span>
                        <span>•</span>
                        <span>{device.devicePixelRatio}x</span>
                        <span>•</span>
                        <span className="truncate">{device.brand}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {device.isCustom && (
                      <>
                        <button
                          onClick={() => onEditDevice(device)}
                          className="rounded p-1 text-zinc-400 opacity-0 hover:bg-zinc-200 hover:text-zinc-800 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          title="Edit Custom Device"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteDevice(device.id)}
                          className="rounded p-1 text-zinc-400 opacity-0 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                          title="Delete Custom Device"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onToggleFavorite(device.id)}
                      className={`rounded p-1 transition ${
                        device.isFavorite
                          ? "text-amber-400"
                          : "text-zinc-400 opacity-40 hover:opacity-100"
                      }`}
                      title={
                        device.isFavorite
                          ? "Remove Favorite"
                          : "Add to Favorites"
                      }
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          device.isFavorite ? "fill-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-zinc-200 p-2.5 dark:border-zinc-800/90">
        <button
          onClick={onOpenAddModal}
          className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-[0.99] transition"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Custom Device
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1 rounded-lg border border-zinc-300 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Upload className="h-3 w-3" />
            Import JSON
          </button>
          <button
            onClick={onExportDevices}
            className="flex items-center justify-center gap-1 rounded-lg border border-zinc-300 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Download className="h-3 w-3" />
            Export JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
      </div>
    </aside>
  );
};
