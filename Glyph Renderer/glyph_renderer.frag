
const float CURVE_RES = 50.;

//I followed Sebastain Lange's text rendering video here: 
//https://www.youtube.com/watch?v=SO83KQuuZvg&t=346s

const float THICKNESS = .01;
const float FONT_SIZE = 400.;

const vec2 endpoints[2] = vec2[2](vec2(0,7),vec2(8,18));
const int numContours = 2;
const float unitsPerEm = 1000.;
const vec2 minBound = vec2(35, 0);
const vec2 maxBound = vec2(565, 730);
const vec2 glyphBound = vec2( maxBound.x - minBound.x, maxBound.y - minBound.y );
const vec2 points[19] = vec2[19](vec2(35,0),vec2(219,730),vec2(380,730),vec2(565,0),vec2(437,0),
                                vec2(397,177),vec2(203,177),vec2(163,0),vec2(226,279),vec2(374,279),
                                vec2(330,475),vec2(319,524),vec2(311.0,563.5),vec2(303,603),
                                vec2(300,621),vec2(297,603),vec2(289.0,563.5),vec2(281,524),
                                vec2(270,476));
const bool contour[19] = bool[19](true, true, true, true, true, true, true, true, true, 
                                  true, true, false, true, false, true, false,true, false, true);
                     

float drawLine( in vec2 a, in vec2 b, vec2 p )
{
    vec2 ab = b - a;
    vec2 ap = p - a;
    
    float c = ap.x*ab.y - ap.y*ab.x;
    
    //I made dist unsigned for now but I suspect
    //That I will want it signed later so I can actually
    //fill the letters
    float dist = abs(c / length(ab));
    
    if ( dist > THICKNESS ) return 0.;
    
    float t = dot(ap, ab) / dot(ab, ab);
    
    if (t < 0. || t > 1.) return 0.;
    
    return 1. - dist / THICKNESS;
    
}

vec2 convert_coord(in vec2 p) {
    float scale_x = FONT_SIZE / unitsPerEm * (glyphBound.x / maxBound.x);
    float scale_y = FONT_SIZE / unitsPerEm * (glyphBound.y / maxBound.y);
    
    vec2 centered = (p - .5 * glyphBound);
    
    vec2 scaled = vec2(centered.x * scale_x, centered.y * scale_y);
    
    return (scaled / maxBound) * 2.0;
}



vec2 bezInterpolate(  in vec2 p0, in vec2 p1,
                      in vec2 p2, in float t )
{
    vec2 a = mix( p0, p1, t );
    vec2 b = mix( p1, p2, t );
    return mix( a, b, t);
}

float drawCurve( in vec2 p0, in vec2 p1,
                 in vec2 p2, in vec2 pos )
{
  //Basically given any coordinate, deterimine if it lies on the curve
  
  vec2 prev = p0;
  
  float hit = 0.;
  
  for (int i=0; i<int(CURVE_RES); i++)
  {
      float t = (float(i) + 1.) / CURVE_RES;
      
      vec2 next = bezInterpolate(p0,p1,p2,t);
      
      hit += drawLine( prev, next, pos );
      
      prev = next;
  }
  
  return hit;
}

float drawPoint( in vec2 p )
{
    float hit = 0.;
    for( int i=0;i<62;i++ )
    {
        if (distance(p,convert_coord(points[i])) < .01)
        {
            hit = 1.;
        }
    }
    return hit;
}

float draw_glyph(in vec2 pos)
{
    float hit = 0.;

    for (int p = 0; p < numContours; p++)
    {
        int start = int(endpoints[p].x);
        int end   = int(endpoints[p].y);
        int n     = end - start + 1;

        for (int i = start; i <= end; i++)
        {
            int local = i - start;

            int i1 = start + ((local + 1) % n);
            int i2 = start + ((local + 2) % n);

            // Off-curve point: it will be consumed as a control point
            // by the previous on-curve point.
            if (!contour[i])
            {
                continue;
            }

            // on-curve -> off-curve -> on-curve
            if (!contour[i1])
            {
                hit += drawCurve(
                    convert_coord(points[i]),
                    convert_coord(points[i1]),
                    convert_coord(points[i2]),
                    pos
                );
            }
            // on-curve -> on-curve
            else
            {
                hit += drawLine(
                    convert_coord(points[i]),
                    convert_coord(points[i1]),
                    pos
                );
            }
        }
    }

    return hit;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = ( fragCoord * 2.0 - iResolution.xy ) / iResolution.y;
     
    float d = draw_glyph( uv );
    
    fragColor = vec4(d,d,d,1.);
}

//do it with sdfs i feel like that would be cool
//then render that into a texture, that would be pretty sick
//Then use texture as atlas. Then at render time all you need to do 