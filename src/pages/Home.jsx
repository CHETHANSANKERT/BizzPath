import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Hero from "@/components/home/Hero";
import CategoryStrip from "@/components/home/CategoryStrip";
import TrendingGrid from "@/components/home/TrendingGrid";
import InvestmentFilters from "@/components/home/InvestmentFilters";
import HowItWorks from "@/components/home/HowItWorks";
import CreatorSpotlight from "@/components/home/CreatorSpotlight";
import CtaBand from "@/components/home/CtaBand";
import RequestDialog from "@/components/RequestDialog";
import { categories as fallbackCategories } from "@/data/sampleData";

export default function Home() {
    const [blueprints, setBlueprints] = useState(null);
    const [categories, setCategories] = useState([]);
    const [creators, setCreators] = useState([]);
    const [publishOpen, setPublishOpen] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchHomeData = async () => {
            try {
                const [blueprintResult, categoryResult, creatorResult] =
                    await Promise.all([
                        supabase
                            .from("blueprints")
                            .select("*")
                            .eq("status", "published")
                            .order("buyer_count", { ascending: false })
                            .limit(60),

                        supabase
                            .from("categories")
                            .select("*")
                            .order("order", { ascending: true })
                            .limit(20),

                        supabase
                            .from("creators")
                            .select("*")
                            .order("rating", { ascending: false })
                            .limit(20),
                    ]);

                if (blueprintResult.error) throw blueprintResult.error;
                if (categoryResult.error) throw categoryResult.error;
                if (creatorResult.error) throw creatorResult.error;

                if (!active) return;

                setBlueprints(blueprintResult.data || []);
                setCategories(categoryResult.data || []);
                setCreators(creatorResult.data || []);
            } catch (error) {
                console.error("Home page data fetch error:", error);

                if (active) {
                    setBlueprints([]);
                    setCategories([]);
                    setCreators([]);
                }
            }
        };

        fetchHomeData();

        return () => {
            active = false;
        };
    }, []);

    const list = blueprints || [];
    const counts = list.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    const featured = list.filter((item) => item.featured);
    const trending = (featured.length ? featured : list).slice(0, 3);

    return (
        <>
            <Hero
                stats={{
                    blueprints: blueprints ? list.length : "—",
                    creators: creators.length || "—",
                    categories: categories.length || fallbackCategories.length,
                }}
            />
            <CategoryStrip
                categories={categories.length ? categories : fallbackCategories}
                counts={counts}
            />
            {trending.length ? <TrendingGrid items={trending} /> : null}
            <InvestmentFilters />
            <HowItWorks />
            <CreatorSpotlight
                creators={creators.slice(0, 3)}
                blueprints={list}
            />
            <div className="pt-20">
                <CtaBand onPublish={() => setPublishOpen(true)} />
            </div>
            <RequestDialog
                open={publishOpen}
                onOpenChange={setPublishOpen}
                type="creator-application"
            />
        </>
    );
}
