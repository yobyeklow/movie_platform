
export interface Movie {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  genreIds: number[];
  popularity: number;
  adult: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logoPath?: string;
  name: string;
  originCountry: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  englishName: string;
  iso_639_1: string;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  publishedAt: string;
}

export interface MovieDetail {
  id: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  imdbId: string;
  originalLanguage: string;
  genres: Genre[];
  productionCompanies: ProductionCompany[];
  productionCountries: ProductionCountry[];
  spokenLanguages: SpokenLanguage[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
}

export interface VideoPlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (errorCode: number) => void;
}

export interface MovieCastProps {
  cast: CastMember[];
  crew: CrewMember[];
  limit?: number;
}

export interface MovieInfoProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface MovieMetadataProps {
  movie: MovieDetail;
}

export interface MovieDetailProps {
  movieId: number;
  loading?: boolean;
  error?: string | null;
}

export interface CastCardProps {
  member: CastMember;
}

export interface VideoThumbnailProps {
  video: Video;
  onSelect: (video: Video) => void;
  isSelected?: boolean;
}

export interface SimilarMovieCardProps {
  movie: Movie;
  onClick: (movieId: number) => void;
}

export interface BackButtonProps {
  onClick: () => void;
}

export interface ShareButtonProps {
  movie: MovieDetail;
}

export interface FavoriteButtonProps {
  movie: MovieDetail;
  isFavorite: boolean;
  onToggle: () => void;
}

export interface WatchHistoryItem {
  movieId: number;
  title: string;
  posterPath: string;
  timestamp: number;
  progress: number; // Percentage watched
}

export interface MovieDetailState {
  movie: MovieDetail | null;
  loading: boolean;
  error: string | null;
  selectedVideo: Video | null;
  showFullCast: boolean;
}

export interface MovieDetailActions {
  fetchMovieDetail: (id: number) => Promise<void>;
  setSelectedVideo: (video: Video | null) => void;
  toggleFullCast: () => void;
  addToFavorites: (movie: MovieDetail) => void;
  removeFromFavorites: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export type MovieDetailContextType = MovieDetailState & MovieDetailActions;
