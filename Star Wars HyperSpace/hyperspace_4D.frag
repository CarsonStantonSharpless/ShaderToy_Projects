const float H = .95;

//forgive my very crude solution to creating the permuation matrix
//idk why I made them floats
const float p[256] = float[256]( 151.,160.,137.,91.,90.,15.,131.,13.,201.,95.,96.,53.,
                                 194.,233.,7.,225.,140.,36.,103.,30.,69.,142.,8.,99.,37.,
                                 240.,21.,10.,23.,190.,6.,148.,247.,120.,234.,75.,0.,26.,
                                 197.,62.,94.,252.,219.,203.,117.,35.,11.,32.,57.,177.,33.,
                                 88.,237.,149.,56.,87.,174.,20.,125.,136.,171.,168.,68.,
                                 175.,74.,165.,71.,134.,139.,48.,27.,166.,77.,146.,158.,
                                 231.,83.,111.,229.,122.,60.,211.,133.,230.,220.,105.,92.,
                                 41.,55.,46.,245.,40.,244.,102.,143.,54.,65.,25.,63.,161.,
                                 1.,216.,80.,73.,209.,76.,132.,187.,208.,89.,18.,169.,200.,196.,
                                 135.,130.,116.,188.,159.,86.,164.,100.,109.,198.,173.,186.,
                                 3.,64.,52.,217.,226.,250.,124.,123.,5.,202.,38.,147.,118.,126.,
                                 255.,82.,85.,212.,207.,206.,59.,227.,47.,16.,58.,17.,182.,189.,
                                 28.,42.,223.,183.,170.,213.,119.,248.,152.,2.,44.,154.,163.,
                                 70.,221.,153.,101.,155.,167.,43.,172.,9.,129.,22.,39.,253.,19.,
                                 98.,108.,110.,79.,113.,224.,232.,178.,185.,112.,104.,218.,246.,
                                 97.,228.,251.,34.,242.,193.,238.,210.,144.,12.,191.,179.,
                                 162.,241.,81.,51.,145.,235.,249.,14.,239.,107.,49.,192.,214.,
                                 31.,181.,199.,106.,157.,184.,84.,204.,176.,115.,121.,50.,45.,
                                 127.,4.,150.,254.,138.,236.,205.,93.,222.,114.,67.,29.,
                                 24.,72.,243.,141.,128.,195.,78.,66.,215.,61.,156.,180. );

//oh boy, now that we are in 4D I am gonna use the midpoints
//of all the edges of a hypercube
const vec4 gradient[32] = vec4[32](
                            vec4(0.0,1.0,1.0,1.0), vec4(0.0,1.0,1.0,-1.0), vec4(0.0,1.0,-1.0,1.0),
                            vec4(0.0,1.0,-1.0,-1.0), vec4(0.0,-1.0,1.0,1.0), vec4(0.0,-1.0,1.0,-1.0),
                            vec4(0.0,-1.0,-1.0,1.0), vec4(0.0,-1.0,-1.0,-1.0), vec4(1.0,0.0,1.0,1.0),
                            vec4(1.0,0.0,1.0,-1.0), vec4(1.0,0.0,-1.0,1.0), vec4(1.0,0.0,-1.0,-1.0),
                            vec4(-1.0,0.0,1.0,1.0), vec4(-1.0,0.0,1.0,-1.0), vec4(-1.0,0.0,-1.0,1.0),
                            vec4(-1.0,0.0,-1.0,-1.0), vec4(1.0,1.0,0.0,1.0), vec4(1.0,1.0,0.0,-1.0),
                            vec4(1.0,-1.0,0.0,1.0), vec4(1.0,-1.0,0.0,-1.0), vec4(-1.0,1.0,0.0,1.0),
                            vec4(-1.0,1.0,0.0,-1.0), vec4(-1.0,-1.0,0.0,1.0), vec4(-1.0,-1.0,0.0,-1.0),
                            vec4(1.0,1.0,1.0,0.0), vec4(1.0,1.0,-1.0,0.0), vec4(1.0,-1.0,1.0,0.0),
                            vec4(1.0,-1.0,-1.0,0.0), vec4(-1.0,1.0,1.0,0.0), vec4(-1.0,1.0,-1.0,0.0),
                            vec4(-1.0,-1.0,1.0,0.0), vec4(-1.0,-1.0,-1.0,0.0));

//lookup table to traverse simplex
const int simp_table[256] = int[](
                                0, 1, 2, 3, 0, 1, 3, 2, 0, 0, 0, 0, 0, 2, 3, 1,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 0,
                                0, 2, 1, 3, 0, 0, 0, 0, 0, 3, 1, 2, 0, 3, 2, 1,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 2, 0,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                1, 2, 0, 3, 0, 0, 0, 0, 1, 3, 0, 2, 0, 0, 0, 0,
                                0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 0, 1, 2, 3, 1, 0,
                                1, 0, 2, 3, 1, 0, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0,
                                0, 0, 0, 0, 2, 0, 3, 1, 0, 0, 0, 0, 2, 1, 3, 0,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                2, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                3, 0, 1, 2, 3, 0, 2, 1, 0, 0, 0, 0, 3, 1, 2, 0,
                                2, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                                3, 1, 0, 2, 0, 0, 0, 0, 3, 2, 0, 1, 3, 2, 1, 0 );



                                  
const float F = (sqrt(5.)-1.)/4.;
const float G = (5.-sqrt(5.))/20.;

//to deal with wrapping
int perm( in int index ) { return int(p[index & 255]); }

//I'm gonna use simplex noise, going for a kinda
//cloudy look so this should be good
//I used this link mostly for this implementation:
//https://www.researchgate.net/publication/216813608_Simplex_noise_demystified
float simplex_noise3D( in vec4 p )
{
    //skew the coordinates
    float S = ( p.x + p.y + p.z + p.w ) * F;
    
    vec4 trans_coords = vec4(floor( p.x + S ), floor( p.y + S ), floor( p.z + S ), floor( p.w + S ));
    
    //find the distance from input coords and cell origin
    float T = ( trans_coords.x + trans_coords.y + trans_coords.z + trans_coords.w ) * G;
    
    vec4 origin = vec4( trans_coords.x - T, trans_coords.y - T,
                        trans_coords.z - T, trans_coords.w - T );
    
    vec4 o_dist = p - origin;
    
    //determine offsets
    int c = 0;
    c += ( o_dist.x > o_dist.y ) ? 32 : 0;
    c += ( o_dist.x > o_dist.z ) ? 16 : 0;
    c += ( o_dist.y > o_dist.z ) ? 8 : 0;
    c += ( o_dist.x > o_dist.w ) ? 4 : 0;
    c += ( o_dist.y > o_dist.w ) ? 2 : 0;
    c += ( o_dist.z > o_dist.w ) ? 1 : 0;
    
    vec4 offset1 = vec4( simp_table[c * 4 + 0] >= 3 ? 1. : 0. ,
                         simp_table[c * 4 + 1] >= 3 ? 1. : 0. ,
                         simp_table[c * 4 + 2] >= 3 ? 1. : 0. ,
                         simp_table[c * 4 + 3] >= 3 ? 1. : 0. );

    vec4 offset2 = vec4( simp_table[c * 4 + 0] >= 2 ? 1. : 0. ,
                         simp_table[c * 4 + 1] >= 2 ? 1. : 0. ,
                         simp_table[c * 4 + 2] >= 2 ? 1. : 0. ,
                         simp_table[c * 4 + 3] >= 2 ? 1. : 0. );

    vec4 offset3 = vec4( simp_table[c * 4 + 0] >= 1 ? 1. : 0. ,
                         simp_table[c * 4 + 1] >= 1 ? 1. : 0. ,
                         simp_table[c * 4 + 2] >= 1 ? 1. : 0. ,
                         simp_table[c * 4 + 3] >= 1 ? 1. : 0. );
                         
                         
    vec4 simplex[5] = vec4[5]( o_dist,
                               o_dist - offset1 + G,
                               o_dist - offset2 + 2. * G,
                               o_dist - offset3 + 3. * G,
                               o_dist - 1. + 4. * G );
                               
    
    //hashed gradient indices
    int xand = int(trans_coords.x) & 255;
    int yand = int(trans_coords.y) & 255;
    int zand = int(trans_coords.z) & 255;
    int wand = int(trans_coords.w) & 255;
    
    
    int grad_idx[5] = int[5](
        
        perm(xand + perm(yand + perm(zand + perm(wand)))) % 32,
        
        perm(xand + int(offset1.x) + perm(yand + int(offset1.y) + perm(zand + int(offset1.z) 
            + perm(wand + int(offset1.w))))) % 32,
        
        perm(xand + int(offset2.x) + perm(yand + int(offset2.y) + perm(zand + int(offset2.z) 
            + perm(wand + int(offset2.w))))) % 32,            
        
        perm(xand + int(offset3.x) + perm(yand + int(offset3.y) + perm(zand + int(offset3.z) 
            + perm(wand + int(offset3.w))))) % 32,
            
        perm(xand + 1 + perm(yand + 1 + perm(zand + 1 + perm(wand + 1)))) % 32
        
        );
    
    //calculate contributions
    float n0, n1, n2, n3, n4;
    
    float t0 = .5 - simplex[0].x*simplex[0].x - simplex[0].y*simplex[0].y
                  - simplex[0].z*simplex[0].z - simplex[0].w*simplex[0].w;
                  
    if ( t0 < 0. ) { n0 = 0.; }
    else
    {
        t0 *= t0;
        n0 = t0 * t0 * dot( gradient[int(grad_idx[0])], simplex[0] );
    }
    
    float t1 = .5 - simplex[1].x*simplex[1].x - simplex[1].y*simplex[1].y
                  - simplex[1].z*simplex[1].z - simplex[1].w*simplex[1].w;
                  
    if ( t1 < 0. ) { n1 = 0.; }
    else
    {
        t1 *= t1;
        n1 = t1 * t1 * dot( gradient[int(grad_idx[1])], simplex[1] );
    }
    
    float t2 = .5 - simplex[2].x*simplex[2].x - simplex[2].y*simplex[2].y
                  - simplex[2].z*simplex[2].z - simplex[2].w*simplex[2].w;
                  
    if ( t2 < 0. ) { n2 = 0.; }
    else
    {
        t2 *= t2;
        n2 = t2 * t2 * dot( gradient[int(grad_idx[2])], simplex[2] );
    }
    
    float t3 = .5 - simplex[3].x*simplex[3].x - simplex[3].y*simplex[3].y
                  - simplex[3].z*simplex[3].z - simplex[3].w*simplex[3].w;
                  
    if ( t3 < 0. ) { n3 = 0.; }
    else
    {
        t3 *= t3;
        n3 = t3 * t3 * dot( gradient[int(grad_idx[3])], simplex[3] );
    }
    
    float t4 = .5 - simplex[4].x*simplex[4].x - simplex[4].y*simplex[4].y
                  - simplex[4].z*simplex[4].z - simplex[4].w*simplex[4].w;
                  
    if ( t4 < 0. ) { n4 = 0.; }
    else
    {
        t4 *= t4;
        n4 = t4 * t4 * dot( gradient[int(grad_idx[4])], simplex[4] );
    }
    
    return ( 27. * ( n0 + n1 + n2 + n3 + n4 ) + 1.) *.5;
}

float fbm( in vec4 x)
{
    float S = exp2(-H);
    float f = .8;
    float a = 1.4;
    float t = 0.;
    
    for ( int i=0; i<4; i++)
    {
        t += a*(simplex_noise3D(f*x) * 2. - 1.);
        f *= 2.0;
        a *= S;
    }
    
    return (t + 1.) *.5;
}

vec3 palette( in float t )
{
    vec3 a = vec3( 0.000, 0.500, 0.500 );
    vec3 b = vec3( 0.000, 0.500, 0.500 );
    vec3 c = vec3( 0.000, 0.500, 0.333 );
    vec3 d = vec3( 0.000, 0.500, 0.667 );
    
    return a + b * cos( 6.283185*(c*t+d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = ( fragCoord * 2.0 - iResolution.xy ) / iResolution.y;
    
    float d = length(uv);
    
    //for rotating
    float speed = 5. * 3.14159 / 6.;
    
    float theta = iTime * speed;
    
    vec2 dp = vec2( uv.x * cos(theta) - uv.y * sin(theta),
                    uv.x * sin(theta) + uv.y * cos(theta));
                   
    //for warping
    float warp =  d*d*1.2;
   
    float col = (fbm(vec4(dp/warp, iTime, 3.*iTime+ 1./d)));
    
    //make bigger valleys  
    col = pow(col,1.6);
    
    fragColor = vec4(.9 - smoothstep(.05,.15,d) + palette(col), 1.);
}