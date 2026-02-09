
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  DollarSign, 
  Plus,
  ArrowRight,
  Bell,
  Search,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

const data = [
  { name: 'Jan', revenue: 45000 },
  { name: 'Feb', revenue: 52000 },
  { name: 'Mar', revenue: 48000 },
  { name: 'Apr', revenue: 75000 },
  { name: 'May', revenue: 82000 },
  { name: 'Jun', revenue: 60000 },
  { name: 'Jul', revenue: 95000 },
];

const ADMIN_EMAILS = ['kioalaquer301@gmail.com', 'mikefernandex227@gmail.com', 'mikefernandez227@gmail.com'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const isResortAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isUserLoading && (!user || !isResortAdmin)) {
      router.push("/");
    }
  }, [user, isUserLoading, router, isResortAdmin]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isResortAdmin) return null;
    return query(collection(firestore, "bookings"), orderBy("bookingDate", "desc"), limit(5));
  }, [firestore, user, isResortAdmin]);

  const { data: recentBookings } = useCollection(bookingsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isResortAdmin) return null;
    return collection(firestore, "users");
  }, [firestore, user, isResortAdmin]);

  const { data: allUsers } = useCollection(usersQuery);

  const facilitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "facilities");
  }, [firestore]);

  const { data: allFacilities } = useCollection(facilitiesQuery);

  if (isUserLoading || !user || !isResortAdmin) return null;

  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

  const stats = [
    { label: "Total revenue", value: `₱${totalRevenue.toLocaleString()}`, trend: "+12.5%", positive: true, icon: DollarSign },
    { label: "Active bookings", value: recentBookings?.length.toString() || "0", trend: "+4.3%", positive: true, icon: CalendarCheck },
    { label: "Total facilities", value: allFacilities?.length.toString() || "0", trend: "0%", positive: true, icon: TrendingUp },
    { label: "Total guests", value: allUsers?.length.toString() || "0", trend: "+18.2%", positive: true, icon: Users },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9]">
      <Header />
      
      <div className="flex flex-1 overflow-hidden pt-0 md:pt-32">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-normal font-headline tracking-[-0.05em]">Admin <span className="text-primary">Overview</span></h1>
              <p className="text-sm text-muted-foreground font-normal">Welcome back. System status is normal.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full shadow-sm h-12 w-12 bg-white border-none"><Bell className="h-5 w-5" /></Button>
              <Button className="bg-black hover:bg-primary transition-colors rounded-full px-8 h-12 shadow-sm" asChild>
                <Link href="/admin-facilities"><Plus className="mr-2 h-4 w-4" /> Add facility</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[25px] bg-white">
                <CardContent className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <stat.icon className="h-6 w-6 md:h-7 md:w-7" />
                    </div>
                    <Badge variant="outline" className={cn(
                      "font-bold rounded-full px-3 py-1 text-[10px] md:text-xs",
                      stat.positive ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                    )}>
                      {stat.trend}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium mb-1 tracking-tight">{stat.label}</p>
                    <h3 className="text-xl md:text-3xl font-normal font-headline tracking-[-0.05em]">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[25px] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-headline font-normal tracking-[-0.05em]">Revenue growth</CardTitle>
                <CardDescription>Monthly revenue trends</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[400px] p-8 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e03d8f" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#e03d8f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#888'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#888'}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'}}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#e03d8f" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[25px] bg-white">
              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-headline font-normal tracking-[-0.05em]">Quick actions</CardTitle>
                <CardDescription>Manage resort operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8">
                <button className="w-full flex items-center gap-3 rounded-full h-14 shadow-sm text-sm border-none bg-[#f8f8f8] hover:bg-muted px-6 transition-all" onClick={() => router.push("/admin-bookings")}>
                  <Search className="h-5 w-5 text-primary" /> Filter bookings
                </button>
                <button className="w-full flex items-center gap-3 rounded-full h-14 shadow-sm text-sm border-none bg-[#f8f8f8] hover:bg-muted px-6 transition-all" onClick={() => router.push("/admin-messages")}>
                  <MessageCircle className="h-5 w-5 text-primary" /> Guest messages
                </button>
                <button className="w-full flex items-center gap-3 rounded-full h-14 shadow-sm text-sm border-none bg-[#f8f8f8] hover:bg-muted px-6 transition-all" onClick={() => router.push("/admin-facilities")}>
                  <Plus className="h-5 w-5 text-primary" /> New service
                </button>
                <div className="pt-6 mt-4 border-t">
                  <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-[15px]">
                    <TrendingUp className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold tracking-tight text-primary">AI Insight</p>
                      <p className="text-sm font-medium leading-tight">High demand for Kubos this weekend. Consider a small peak surcharge.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[25px] overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div>
                <CardTitle className="text-2xl font-headline font-normal tracking-[-0.05em]">Recent bookings</CardTitle>
                <CardDescription>New incoming requests</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-full px-6 h-10 shadow-sm border-none bg-[#f8f8f8] hover:bg-muted text-xs font-bold" asChild>
                <Link href="/admin-bookings">View all <ArrowRight className="ml-2 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b text-muted-foreground font-medium tracking-tight text-xs">
                      <th className="text-left pb-5 px-2">Booking ID</th>
                      <th className="text-left pb-5 px-2">Status</th>
                      <th className="text-left pb-5 px-2">Guests</th>
                      <th className="text-right pb-5 px-2">Total price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings?.map((bk) => (
                      <tr key={bk.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-6 px-2 font-mono font-bold text-xs">{bk.id.slice(0, 10)}</td>
                        <td className="py-6 px-2">
                          <Badge variant="outline" className={cn(
                            "rounded-full px-4 py-1 text-[10px] font-bold",
                            bk.status === "Confirmed" && "bg-blue-50 text-blue-600 border-blue-200",
                            bk.status === "Pending" && "bg-orange-50 text-orange-600 border-orange-200",
                            bk.status === "Completed" && "bg-green-50 text-green-600 border-green-200",
                            bk.status === "Cancelled" && "bg-red-50 text-red-600 border-red-200",
                          )}>
                            {bk.status}
                          </Badge>
                        </td>
                        <td className="py-6 px-2 text-muted-foreground">{bk.numberOfGuests} guests</td>
                        <td className="py-6 px-2 text-right font-black text-lg">₱{bk.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!recentBookings || recentBookings.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-muted-foreground italic">No recent bookings found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
