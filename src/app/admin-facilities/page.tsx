
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, X, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AMENITY_OPTIONS = [
  "Fast Wi-Fi",
  "Air Conditioning",
  "Freshwater View",
  "Pet Friendly",
  "Free Parking",
  "Morning Coffee",
  "Swimming Pool Access",
  "Breakfast Included",
  "Private Balcony",
  "Kitchenette"
];

const ACCOMMODATION_TYPES = [
  "Kubo",
  "Kubo sa Ilog",
  "Cabana",
  "Standard Room",
  "Deluxe Room",
  "A-House",
  "Function Hall",
  "Camping Tent"
];

const DURATION_OPTIONS = [
  "Day & night stay",
  "Day use only (8 AM - 5 PM)",
  "Night use only (6 PM - 7 AM)",
  "Hourly rate"
];

export default function AdminFacilitiesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customAmenity, setCustomAmenity] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "Kubo",
    description: "",
    capacity: 0,
    pricePerNight: 0,
    imageUrl: "https://picsum.photos/seed/resort/800/600",
    status: "Available",
    duration: "Day & night stay",
    amenities: [] as string[]
  });

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== 'kioalaquer301@gmail.com')) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "facilities");
  }, [firestore]);

  const { data: facilities } = useCollection(facilitiesQuery);

  const handleSave = () => {
    if (!firestore) return;
    if (!formData.name) {
      toast({ variant: "destructive", title: "Missing info", description: "Please provide a facility name." });
      return;
    }

    const id = editingId || doc(collection(firestore, "facilities")).id;
    const facilityRef = doc(firestore, "facilities", id);
    
    setDocumentNonBlocking(facilityRef, {
      ...formData,
      id
    }, { merge: true });

    setEditingId(null);
    setFormData({
      name: "",
      type: "Kubo",
      description: "",
      capacity: 0,
      pricePerNight: 0,
      imageUrl: "https://picsum.photos/seed/resort/800/600",
      status: "Available",
      duration: "Day & night stay",
      amenities: []
    });

    toast({
      title: editingId ? "Facility updated" : "Facility added",
      description: `Successfully ${editingId ? "updated" : "added"} ${formData.name}.`
    });
  };

  const handleEdit = (facility: any) => {
    setEditingId(facility.id);
    setFormData({
      name: facility.name,
      type: facility.type || "Kubo",
      description: facility.description,
      capacity: facility.capacity,
      pricePerNight: facility.pricePerNight,
      imageUrl: facility.imageUrl,
      status: facility.status,
      duration: facility.duration || "Day & night stay",
      amenities: facility.amenities || []
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, "facilities", id));
    toast({
      variant: "destructive",
      title: "Facility deleted",
      description: "The facility has been removed from the system."
    });
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!formData.amenities.includes(customAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()]
      }));
    }
    setCustomAmenity("");
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  if (isUserLoading || !user || user.email !== 'kioalaquer301@gmail.com') return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-0 md:pt-32 pb-24">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em]">Manage <span className="text-primary">Facilities</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Configure resort stays and event spaces with detailed amenities.</p>
          </div>
          {editingId && (
            <button className="flex items-center gap-2 px-6 h-12 bg-white rounded-full shadow-sm hover:bg-muted transition-colors text-sm font-bold" onClick={() => {
              setEditingId(null);
              setFormData({ name: "", type: "Kubo", description: "", capacity: 0, pricePerNight: 0, imageUrl: "https://picsum.photos/seed/resort/800/600", status: "Available", duration: "Day & night stay", amenities: [] });
            }}>
              <X className="h-4 w-4" /> Cancel edit
            </button>
          )}
        </div>

        <Card className="mb-16 border-none shadow-sm rounded-[30px] overflow-hidden bg-white p-2">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-normal tracking-[-0.05em]"> 
              {editingId ? "Update existing listing" : "Create new resort experience"}
            </CardTitle>
            <CardDescription>Enter the full specifications for this facility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Facility name</label>
                <input 
                  value={formData.name} 
                  className="w-full rounded-full px-6 h-14 text-base border-none bg-[#f8f8f8] outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Luxury Private Kubo #1" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Accommodation type</label>
                <select 
                  className="w-full h-14 border-none rounded-full px-6 bg-[#f8f8f8] outline-none text-base focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  {ACCOMMODATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Detailed description</label>
              <textarea 
                value={formData.description} 
                className="w-full rounded-[24px] p-6 min-h-[120px] text-base border-none bg-[#f8f8f8] outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Describe amenities, view, and specific features..." 
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Stay duration</label>
                <select 
                  className="w-full h-14 border-none rounded-full px-6 bg-[#f8f8f8] outline-none text-base" 
                  value={formData.duration} 
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Max capacity</label>
                <input 
                  type="number" 
                  className="w-full rounded-full px-6 h-14 text-base border-none bg-[#f8f8f8] outline-none" 
                  value={formData.capacity} 
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Price per night (₱)</label>
                <input 
                  type="number" 
                  className="w-full rounded-full px-6 h-14 text-base border-none bg-[#f8f8f8] outline-none" 
                  value={formData.pricePerNight} 
                  onChange={e => setFormData({...formData, pricePerNight: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Current status</label>
                <select 
                  className="w-full h-14 border-none rounded-full px-6 bg-[#f8f8f8] outline-none text-base" 
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">Image URL (Visual reference)</label>
              <input 
                className="w-full rounded-full px-6 h-14 text-base border-none bg-[#f8f8f8] outline-none" 
                value={formData.imageUrl} 
                onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              />
            </div>

            <div className="space-y-6">
              <label className="text-xs font-bold ml-1 tracking-tight text-muted-foreground">What this place offers (Amenities)</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 bg-[#f8f8f8] p-6 rounded-[24px]">
                {AMENITY_OPTIONS.map(amenity => (
                  <div key={amenity} className="flex items-center space-x-3">
                    <Checkbox 
                      id={amenity} 
                      checked={formData.amenities.includes(amenity)} 
                      onCheckedChange={() => toggleAmenity(amenity)}
                      className="rounded-[6px] border-black/10 h-5 w-5"
                    />
                    <label 
                      htmlFor={amenity} 
                      className="text-sm font-medium leading-none cursor-pointer select-none opacity-80"
                    >
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input 
                      type="text"
                      className="w-full rounded-full px-6 h-14 text-sm border-none bg-[#f8f8f8] outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Add custom amenity..."
                      value={customAmenity}
                      onChange={(e) => setCustomAmenity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomAmenity()}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-14 rounded-full px-8 font-bold border-none bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={addCustomAmenity}
                  >
                    <Plus className="h-5 w-5 mr-2" /> Add offer
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.amenities.filter(a => !AMENITY_OPTIONS.includes(a)).map(amenity => (
                    <Badge 
                      key={amenity} 
                      variant="secondary" 
                      className="rounded-full px-4 py-2 bg-white border border-black/5 flex items-center gap-2 group"
                    >
                      {amenity}
                      <button onClick={() => removeAmenity(amenity)} className="hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button className="w-full h-16 text-lg font-bold rounded-full shadow-lg bg-black hover:bg-primary transition-all mt-6" onClick={handleSave}>
              {editingId ? "Save changes" : "Publish facility"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {facilities?.map((f) => (
            <Card key={f.id} className="overflow-hidden border-none shadow-sm rounded-[30px] bg-white group transition-all hover:translate-y-[-4px]">
              <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <Image src={f.imageUrl} alt={f.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-6 right-6 flex gap-3">
                  <button className="flex items-center justify-center rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur-md hover:bg-white transition-all" onClick={() => handleEdit(f)}>
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button className="flex items-center justify-center rounded-full shadow-lg h-12 w-12 bg-red-500 text-white hover:bg-red-600 transition-all" onClick={() => handleDelete(f.id)}>
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <CardHeader className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wider">{f.type}</Badge>
                      <Badge variant="outline" className="border-black/5 text-[10px] font-bold opacity-60">{f.duration}</Badge>
                    </div>
                    <CardTitle className="font-normal text-2xl md:text-3xl tracking-[-0.05em] line-clamp-1">{f.name}</CardTitle>
                    <CardDescription className="text-lg font-black text-black mt-1">₱{(f.pricePerNight || 0).toLocaleString()} <span className="text-sm font-medium text-muted-foreground">/ night • {f.capacity} guests</span></CardDescription>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-5 py-1.5 text-[10px] font-bold shrink-0",
                    f.status === "Available" ? "bg-green-50 text-green-600 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200"
                  )} variant="secondary">{f.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-10 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 italic opacity-80">"{f.description}"</p>
                
                {f.amenities && f.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-black/5">
                    {f.amenities.slice(0, 4).map((a: string) => (
                      <div key={a} className="flex items-center gap-1.5 px-3 py-1 bg-[#f8f8f8] rounded-full text-[10px] font-bold opacity-70">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> {a}
                      </div>
                    ))}
                    {f.amenities.length > 4 && (
                      <div className="text-[10px] font-bold opacity-40 px-2">+{f.amenities.length - 4} more</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {(!facilities || facilities.length === 0) && (
            <div className="col-span-full py-32 text-center text-muted-foreground text-xl italic bg-white rounded-[30px] shadow-sm">
              No facilities listed yet. Add one above!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
