import React, { useState, useMemo } from 'react';
import { RoomUnit, RoomCategory, StayType } from '../types';
import { 
  Users,
  BedDouble, 
  Wifi, 
  Wind, 
  Waves, 
  UtensilsCrossed, 
  Car, 
  Sparkles, 
  ChevronRight, 
  Clock, 
  Info,
  CheckCircle2,
  Lock,
  ShieldCheck,
  X,
  RotateCcw,
  Moon
} from 'lucide-react';
import { VillaLogo } from './VillaLogo';

const FALLBACK_ROOM_IMAGE = 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80';

interface ExploreRoomsTabProps {
  rooms: RoomUnit[];
  onSelectRoomForBooking: (roomId: string, preferredStayType?: StayType) => void;
}

export const ExploreRoomsTab: React.FC<ExploreRoomsTabProps> = ({
  rooms,
  onSelectRoomForBooking,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stayTypePreference, setStayTypePreference] = useState<StayType>('nightly');
  const [minGuests, setMinGuests] = useState<number>(1);
  const [activeImageIndexes, setActiveImageIndexes] = useState<{ [roomId: string]: number }>({});
  const [inspectRoom, setInspectRoom] = useState<RoomUnit | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const list: string[] = ['All'];
    rooms.forEach((r) => {
      if (!list.includes(r.category)) {
        list.push(r.category);
      }
    });
    return list;
  }, [rooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Category match
      if (selectedCategory !== 'All' && room.category !== selectedCategory) {
        return false;
      }
      // Capacity match
      if (room.capacity.maxGuests < minGuests) {
        return false;
      }
      return true;
    });
  }, [rooms, selectedCategory, minGuests]);

  const handleNextImage = (roomId: string, imagesCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (imagesCount <= 1) return;
    setActiveImageIndexes((prev) => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % imagesCount,
    }));
  };

  const getAmenityIcon = (amenityText: string) => {
    const text = amenityText.toLowerCase();
    if (text.includes('pool')) return <Waves className="w-3.5 h-3.5 text-[#D4AF37]" />;
    if (text.includes('aircon') || text.includes('ac')) return <Wind className="w-3.5 h-3.5 text-[#8B6B10]" />;
    if (text.includes('private cr') || text.includes('cr')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    if (text.includes('wi-fi') || text.includes('wifi')) return <Wifi className="w-3.5 h-3.5 text-amber-600" />;
    if (text.includes('parking')) return <Car className="w-3.5 h-3.5 text-[#8B6B10]" />;
    if (text.includes('kitchen')) return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-800" />;
    if (text.includes('billard') || text.includes('darts')) return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
    if (text.includes('cctv')) return <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />;
    if (text.includes('double lock') || text.includes('door')) return <Lock className="w-3.5 h-3.5 text-[#3D2616]" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-[#8B6B10]" />;
  };

  const getCategoryCount = (categoryName: string) => {
    if (categoryName === 'All') return rooms.length;
    return rooms.filter((r) => r.category === categoryName).length;
  };

  return (
    <div className="space-y-10">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#B8860B]/20 border border-[#E6D7C3] px-4 py-1.5 rounded-full text-xs font-bold text-[#8B6B10] uppercase tracking-[0.18em] shadow-xs">
          <VillaLogo size={18} variant="gold" />
          <span className="font-monogram">Accommodations &amp; Private Suites</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C1E15] tracking-tight">
          Explore Rooms &amp; Private Villa Units
        </h2>
        <p className="text-sm sm:text-base text-[#6E5544] leading-relaxed">
          Standard amenities included in all units (Aircon, Private CR, Wi-Fi, Wide Parking, Common Kitchen, Billiards/Darts, 24HR CCTV, Pet Allowed, Double Lock Doors) plus exclusive private swimming pool for our Private Villa.
        </p>
      </div>

      {/* Filter and Control Bar (Modern Boutique Heritage) */}
      <div className="bg-white/90 backdrop-blur-md border border-[#E7DEC8] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Top Filter Row: Category Tabs & Stay Type Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          
          {/* Category Tabs: Sleek Segmented Bar */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F8F5EE] p-1 rounded-xl border border-[#E8DEC9]/80">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#24170E] text-[#FAF7F0] shadow-xs'
                      : 'text-[#5C4534] hover:text-[#24170E] hover:bg-white/70'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#D4AF37]/25 text-[#F5E2B3] font-semibold'
                        : 'bg-[#EBDDC8]/60 text-[#6B533E]'
                    }`}
                  >
                    {getCategoryCount(cat)}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Secondary Filter: Capacity Slider & Result Counter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E8DEC9]/60 items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#5C4534] whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Min. Guests:</span>
              <span className="font-mono text-xs font-bold text-[#24170E] bg-[#F4EFE6] px-2 py-0.5 rounded-md border border-[#E8DEC9]">
                {minGuests} {minGuests === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={minGuests}
              onChange={(e) => setMinGuests(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E8DEC9] rounded-lg appearance-none cursor-pointer accent-[#24170E]"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-[#7A624E]">
              Showing <strong className="text-[#24170E] font-semibold">{filteredRooms.length}</strong> of {rooms.length} units
            </span>
            {(selectedCategory !== 'All' || minGuests > 1) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setMinGuests(1);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B6B10] bg-[#FAF5EA] hover:bg-[#F2E8D5] border border-[#E5D7BE] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filteredRooms.map((room) => {
          const roomImages = Array.isArray(room.images) && room.images.length > 0 ? room.images : [FALLBACK_ROOM_IMAGE];
          const activeImgIdx = (activeImageIndexes[room.id] || 0) % roomImages.length;
          const currentImg = roomImages[activeImgIdx] || roomImages[0] || FALLBACK_ROOM_IMAGE;

          return (
            <div
              key={room.id}
              className="group bg-white rounded-3xl border border-[#E6D7C3] overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Section */}
              <div 
                onClick={(e) => {
                  if (roomImages.length > 1) {
                    handleNextImage(room.id, roomImages.length, e);
                  }
                }}
                className={`relative aspect-[4/3] overflow-hidden bg-stone-200 ${
                  roomImages.length > 1 ? 'cursor-pointer' : ''
                }`}
                title={roomImages.length > 1 ? 'Click to cycle room photos' : undefined}
              >
                <img
                  src={currentImg}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_ROOM_IMAGE) {
                      target.src = FALLBACK_ROOM_IMAGE;
                    }
                  }}
                />

                {/* Room Number Badge (Top-Left) with Gold Frame */}
                <div className="absolute top-3.5 left-3.5 bg-[#1F140C]/90 backdrop-blur-md text-[#FFF2CC] border border-[#D4AF37]/50 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider shadow-md flex items-center gap-1.5 font-monogram">
                  <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-pulse"></span>
                  <span>{room.roomNumber || room.title}</span>
                </div>

                {/* Capacity Pill (Top-Right) */}
                <div className="absolute top-3.5 right-3.5 bg-black/65 backdrop-blur-md text-[#FFFDF7] border border-white/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>{room.capacity.recommended}</span>
                </div>

                {/* Multi-image thumbnail stepper */}
                {roomImages.length > 1 && (
                  <button
                    onClick={(e) => handleNextImage(room.id, roomImages.length, e)}
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-[#2C1E15] px-2.5 py-1 rounded-xl text-[11px] font-bold backdrop-blur-sm shadow-md transition-colors cursor-pointer border border-[#E6D7C3]"
                  >
                    Photo {activeImgIdx + 1}/{roomImages.length} ↻
                  </button>
                )}

                {/* Category Pill (Bottom-Left) */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-[#2C1E15] px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-[#E6D7C3]">
                  <span>{room.category}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                
                {/* Title & Subtitle */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2C1E15] group-hover:text-[#8B6B10] transition-colors leading-snug">
                      {room.title}
                    </h3>
                  </div>
                  <p className="text-xs font-semibold text-[#8B6B10] mt-0.5">
                    {room.subtitle}
                  </p>
                  {/* Bed Configuration Chip on Room Card */}
                  <div className="flex items-center gap-1.5 text-xs text-[#523A2A] font-medium mt-2 bg-[#FAF7F2] border border-[#E6D7C3]/80 px-2.5 py-1.5 rounded-xl shadow-2xs">
                    <BedDouble className="w-3.5 h-3.5 text-[#B8860B] shrink-0" />
                    <span className="font-semibold text-[#8B6B10]">Beds:</span>
                    <span className="line-clamp-1 text-[#2C1E15] font-medium">{room.beds}</span>
                  </div>
                  <p className="text-xs text-[#4A3222]/85 mt-2 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>
                </div>

                {/* Standard Amenities List Chips */}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#4A3222]">
                  {room.amenities.slice(0, 5).map((amenity, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                        amenity.includes('Swimming Pool') 
                          ? 'bg-amber-50/80 border-[#D4AF37] text-[#8B6B10] font-bold' 
                          : 'bg-[#FAF7F2] border-[#E6D7C3]/70'
                      }`}
                    >
                      {getAmenityIcon(amenity)}
                      <span>{amenity}</span>
                    </div>
                  ))}
                  {room.amenities.length > 5 && (
                    <span className="px-2 py-1 rounded-lg bg-[#FAF7F2] text-[#7A604D] text-[10px] font-semibold flex items-center border border-[#E6D7C3]/50">
                      +{room.amenities.length - 5} more
                    </span>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setInspectRoom(room)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E6D7C3] text-[#2C1E15] hover:bg-[#FAF7F2] text-xs font-bold transition-all cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-[#7A604D]" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => onSelectRoomForBooking(room.id, stayTypePreference)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] hover:from-[#A67908] hover:to-[#B8860B] text-white text-xs font-bold transition-all cursor-pointer shadow-md group-hover:shadow-lg border border-white/20 active:scale-95"
                  >
                    <span>Book {room.roomNumber || 'Room'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#FFFDF7]" />
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E6D7C3] p-8 space-y-3">
          <VillaLogo size={40} variant="gold" className="mx-auto" />
          <h3 className="font-serif font-bold text-xl text-[#2C1E15]">No Rooms Match Your Current Filters</h3>
          <p className="text-sm text-[#6E5544] max-w-md mx-auto">
            Try adjusting your guest capacity requirement to view available units.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setMinGuests(1);
            }}
            className="px-5 py-2.5 bg-[#1F140C] text-white text-xs font-bold rounded-xl mt-2 cursor-pointer shadow-md"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Room Details Modal */}
      {inspectRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E6D7C3] shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setInspectRoom(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#E6D7C3]/50 hover:bg-[#E6D7C3] text-[#2C1E15] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E6D7C3]/60 text-[#8B6B10] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-[#E6D7C3]">
                {inspectRoom.category}
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C1E15]">
                {inspectRoom.title}
              </h3>
              <p className="text-sm text-[#6E5544]">{inspectRoom.subtitle}</p>
            </div>

            {/* Image Gallery */}
            <div className={`grid gap-2 rounded-2xl overflow-hidden border border-[#E6D7C3] ${(inspectRoom.images?.length || 1) === 1 ? 'grid-cols-1' : inspectRoom.images?.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
              {(Array.isArray(inspectRoom.images) && inspectRoom.images.length > 0 ? inspectRoom.images : [FALLBACK_ROOM_IMAGE]).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${inspectRoom.title} photo ${i + 1}`}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_ROOM_IMAGE) {
                      target.src = FALLBACK_ROOM_IMAGE;
                    }
                  }}
                  className={`w-full object-cover hover:scale-105 transition-transform ${(inspectRoom.images?.length === 3 && i === 0) ? 'sm:col-span-3 h-52' : inspectRoom.images?.length === 3 ? 'h-32' : 'h-40'}`}
                />
              ))}
            </div>

            {/* Key Specs & Pricing Info */}
            <div className="space-y-3">
              {inspectRoom.id === 'private-villa-pool' && (
                <div className="bg-gradient-to-r from-amber-500 to-[#B8860B] text-white p-3.5 rounded-2xl shadow-md flex items-center gap-3">
                  <Waves className="w-6 h-6 shrink-0 text-[#FFF2CC] animate-pulse" />
                  <div>
                    <div className="font-serif font-bold text-sm">Exclusive Private Swimming Pool</div>
                    <div className="text-[11px] text-amber-100">Included exclusively for your group of up to 20 guests.</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-[#E6D7C3] text-center">
                <div>
                  <div className="text-[11px] text-[#6E5544] font-semibold">Unit Number</div>
                  <div className="text-xs font-bold text-[#2C1E15] mt-0.5">{inspectRoom.roomNumber || inspectRoom.roomNumbers.join(', ')}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#6E5544] font-semibold">Capacity</div>
                  <div className="text-xs font-bold text-[#2C1E15] mt-0.5">{inspectRoom.capacity.recommended}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#6E5544] font-semibold">Beds Configuration</div>
                  <div className="text-xs font-bold text-[#2C1E15] mt-0.5 line-clamp-2" title={inspectRoom.beds}>{inspectRoom.beds}</div>
                </div>
              </div>

              {/* Rate & Pricing Box */}
              <div className="p-4 bg-gradient-to-r from-amber-50/90 to-amber-100/60 rounded-2xl border border-[#D4AF37]/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#8B6B10] border-b border-[#D4AF37]/30 pb-2">
                  <span>Stay Rates &amp; Tariffs</span>
                  <span className="font-mono bg-white/80 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                    {inspectRoom.id === 'private-villa-pool' ? 'Exclusive Pool Villa' : inspectRoom.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center bg-white/80 p-2 rounded-xl border border-[#E6D7C3]">
                    <span className="text-[#6E5544]">Sunday to Thursday Rate (Sun–Thu):</span>
                    <span className="font-bold text-[#2C1E15]">{inspectRoom.weekdayRateDisplay}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/80 p-2 rounded-xl border border-[#E6D7C3]">
                    <span className="text-[#6E5544]">Friday to Saturday Rate (Fri–Sat):</span>
                    <span className="font-bold text-[#8B6B10]">{inspectRoom.weekendRateDisplay}</span>
                  </div>
                </div>
                {inspectRoom.pricing.hourly3hr && (
                  <div className="flex items-center justify-between bg-white/60 px-3 py-1.5 rounded-xl border border-[#E6D7C3]/60 text-[11px]">
                    <span className="text-[#6E5544]">Short Stay Options:</span>
                    <span className="font-semibold text-[#2C1E15]">
                      3hr: ₱{inspectRoom.pricing.hourly3hr} | 6hr: ₱{inspectRoom.pricing.hourly6hr} | 12hr: ₱{inspectRoom.pricing.hourly12hr}
                    </span>
                  </div>
                )}
                  {inspectRoom.id === 'private-villa-pool' ? (
                    inspectRoom.extraPaxFee && (
                      <div className="text-[11px] text-[#8B6B10] font-semibold pt-1">
                        * Additional pax fee: ₱{inspectRoom.extraPaxFee} per head beyond base occupancy (10 pax).
                      </div>
                    )
                  ) : (
                    <div className="text-[11px] text-[#8B6B10] font-semibold pt-1 bg-amber-50/60 p-2 rounded-lg border border-[#D4AF37]/30 space-y-0.5">
                      <div className="font-bold text-[#2C1E15]">👶 Additional Pax Policy (Rooms 0–13 &amp; 14–16):</div>
                      <div className="text-[#6E5544]">
                        • <strong className="text-emerald-700">1–5 yrs:</strong> FREE (₱0)
                      </div>
                      <div className="text-[#6E5544]">
                        • <strong className="text-[#8B6B10]">6–10 yrs:</strong> ₱200/pax (Sun to Thu) | ₱250/pax (Fri to Sat)
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Included Amenities Full List */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-base text-[#2C1E15]">
                Room &amp; Property Amenities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {inspectRoom.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-[#E6D7C3] text-xs text-[#2C1E15]">
                    {getAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E6D7C3]">
              <button
                type="button"
                onClick={() => setInspectRoom(null)}
                className="px-4 py-2.5 bg-white border border-[#E6D7C3] text-[#2C1E15] font-bold rounded-xl text-xs hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Close Details
              </button>
              <button
                type="button"
                onClick={() => {
                  const roomId = inspectRoom.id;
                  setInspectRoom(null);
                  onSelectRoomForBooking(roomId, stayTypePreference);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#997A15] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>Book This Room</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
