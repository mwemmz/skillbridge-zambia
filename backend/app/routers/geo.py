from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..domain import job_density_rows, refresh_area_stats, supply_gaps
from ..models import User
from ..schemas import DensityPoint, SupplyGapOut

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/job-density", response_model=list[DensityPoint])
def job_density(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_km: float = Query(default=15, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Live supply/demand heatmap around a point (active jobs vs online workers)."""
    return job_density_rows(db, lat, lng, radius_km)


@router.get("/supply-gap", response_model=list[SupplyGapOut])
def supply_gap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persisted rollup of areas where demand outstrips supply."""
    refresh_area_stats(db)
    db.commit()
    return supply_gaps(db)
