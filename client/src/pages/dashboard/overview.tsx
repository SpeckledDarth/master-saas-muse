// Module 2 - Coming soon
/*
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Users, Activity, TrendingUp } from "lucide-react";
import { useStatus } from "@/hooks/use-status";

export default function DashboardOverview() {
  const { data: status } = useStatus();

  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Active Users",
      value: "+2350",
      change: "+180.1% from last month",
      icon: Users,
      trend: "up"
    },
    {
      title: "Sales",
      value: "+12,234",
      change: "+19% from last month",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Active Now",
      value: "+573",
      change: "+201 since last hour",
      icon: Activity,
      trend: "up"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Overview of your project's performance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="shadow-sm">Download</Button>
            <Button className="shadow-md shadow-primary/20">Create Report</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="card-hover border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-border/50">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full flex items-center justify-center bg-muted/10 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Chart visualization would go here
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 border-border/50">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <p className="text-sm text-muted-foreground">
                You made 265 sales this month.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      OM
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Olivia Martin</p>
                      <p className="text-xs text-muted-foreground">
                        olivia.martin@email.com
                      </p>
                    </div>
                    <div className="ml-auto font-medium">+$1,999.00</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
*/

export default function DashboardOverview() {
  return null;
}
