with c as (
  SELECT 
    min(c.cartodb_id) cartodb_id,
    c.provincia, 
    extract(year from date_trunc('year', the_date)) as year, 
    min(so2), 
    max(so2), 
    avg(so2) 
FROM calidad_del_aire_cyl_merge c
group by c.provincia, date_trunc('year', the_date)
  )
select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.min, c.max, c.avg
from c inner join spanish_provinces p on c.provincia = p.nom_prov


select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.min, c.avg, c.max from calidad_del_aire_cyl_anual_so2 c inner join spanish_provinces p on c.provincia = p.nom_prov;

select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.avg from calidad_del_aire_cyl_anual_so2 c inner join spanish_provinces p on c.provincia = p.nom_prov;

select c.cartodb_id, p.the_geom_webmercator, initcap(p.nom_prov), c.year, c.max from calidad_del_aire_cyl_anual_so2 c inner join spanish_provinces p on c.provincia = p.nom_prov;
