"use client";
import { use } from 'react'
import { MovieDetail } from "@/components/movie";
import { useRouter } from 'next/navigation'
export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}){
  const router = useRouter()
  const { slug } = use(params)
  return (
    <main className="MovieDetailPage w-full h-full">
        <MovieDetail movieId={parseInt(slug)} onBack={()=>router.back()}></MovieDetail>
    </main>
  )
}