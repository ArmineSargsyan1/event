import path from 'path';
import logger from 'morgan';
import express, {response} from 'express';
import createError from 'http-errors';
// import errorHandler from './middlewares/errorHandler.js';
import router from './routes/index.js';
import cors from "./middlewares/cors.js";
import './migrate.js';
import axios from "axios";
import Hotel from "./models/Hotels.js";
import Room from "./models/Room.js";
import Photo from "./models/Photo.js";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import createCloudinaryUpload from './middlewares/upload.js';


const uploadRoomImages = createCloudinaryUpload('rooms');

const app = express();
app.use(cors);

const res = {
  "page": 5,
  "total": 25,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPrevPage": true,
  "results": [
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiTEg6MjQ3MTpMSFI6MTc3NTI4OTYwMDpNVUM6MTc3NTI5NjUwMDpidXNpbmVzczpGYWxzZTo6OkxIfExIOjE3MTA6TVVDOjE3NzUzMDY3MDA6REJWOjE3NzUzMTIxMDA6YnVzaW5lc3M6RmFsc2U6OjpMSHxMSDoxNzExOkRCVjoxNzc1OTE5OTAwOk1VQzoxNzc1OTI1NjAwOmJ1c2luZXNzOkZhbHNlOjo6TEh8TEg6MjQ4MjpNVUM6MTc3NTkyOTIwMDpMSFI6MTc3NTkzNjcwMDpidXNpbmVzczpGYWxzZTo6OkxIIiwicHJpY2UiOiI2ODAifQ==",
      "price": 680,
      "from": "London",
      "to": "Munich",
      "airline": "Lufthansa",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-04-04T09:00:00",
      "inboundDate": "2026-04-11T17:05:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H97bDFATimBfhv9EKv8-cVvuEVTHcMiHZTl_q6k1Vyk3Rb_JQyaIrtkbvdenHo5B_fwSE9STbNtW1j6rmcHaMN3eNgRQmaszNBHKhfLz1mkx5zMHEDsGkI20U7cKnWWAgcyJNOXmQUU4UwmeFH5TPhmxEVcKLUObe2t2H0TO6RvlvKVPThXrhqEz4SSLnJVsbxaDKdE0S1qw8oaM7CtCfdVGViZU2TaHYtT5Mi5og7pusGn9hqKN-qM0PmUvcnV5g-s1aY8E_hXCrHadRjvvly5haCiLQ5Q1_wCtabaDAfhD8D6Zg-YpGF1vfF0J3khJ_3DRFWimIbsiJ1cTSIRP_EGmMOTZoTnTT0n2YWTmpB70alSrXaG1_wAeKMynl9EDgRHoOXlJZGKGpUyekyEda8gCF-NhKueE4s0TEem8s3jXJGh8OtXq_CjUr_XP-m0-YkkzHcqTkxrpeVvS8AL3AUJTunr3kUPV0IF9qM6uH2Yj8YXZo_t2dcO9KoVGJNzMflr7F66BqVW1a0MelmH6My_EdUtjJZmqxiCuBCOgbkWRExoVjr09W2kcIGsaMyGq1iQGBNfTg_xdSSya1Bak5UTZtwZ7hOSp-w_RhebQyQX_ZJvoOkGc9yjWv4HJh28yj78-Rjw8vbn9nkOJQz9bgqF2uusECYQhrAi8FaUL5ub_-CpALPJQBJ8GAVyMBnXW6y4zPnmlQf9C6Sv--6jC5luKUG4IMv1QjRIKRDNemGBViGiFeFdjJe-bd8GTjYTqRdTgP-JSAFh2GJYuj5T2DqW9X23MRXOciCx9ip1rxKzWx0xcbhf-w4JlAEgVLZ-uiavAnuZi4hUENKEuJdubWY8qQE0HQzyYH58atXge-zbDOX_TxtWjaOHyUlGV4IGc1fNbn3ZVCT5VrQL-m0trPcKwRNo6s87D6JVvF1lJawPd4ozccb3yq-aRVNvx5q2H0boz12T3euf-brQNiV7zkFvJyZ9wil9QC5xzupR9kcw-bEwLLL3FKNwaOQq4qbwMlaMSGkXfXi8iy_l7e9JWbcA%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 2,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 32
                }
              }
            ]
          },
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 32
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 16
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc1OTIyMDAwOlNQVToxNzc1OTMwNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjQ4OlNQVToxNzc1OTMzNzAwOkRCVjoxNzc1OTM1ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc3NjQ1MjAwOlpBRzoxNzc3NjQ4NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc3NjUwNjAwOkxIUjoxNzc3NjU5MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNiJ9",
      "price": 716,
      "from": "London",
      "to": "Split",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-04-11T16:40:00",
      "inboundDate": "2026-05-01T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HUf115D1Tek7TJl1TtkvZr5qFsB80lG-xcDpzj6OMJBxPIvMrayctvclbJdVYKmRe0swrgByPbrwuZoVkBv87cf-igMREQQbQzS5_GguDV3Nf3xpi55cDvCYdCF3Gc-28VsridPennK6_pPcy0YLmiHDBujHwSMxgYciAszdKHQ0YM_1cKxaxdEnGzrBq2V1Ycw3UT3V6U5Hz9LOrcmSP8Xi0JSEAkJYL8o87U7jej2FVax7B5TUrPxZ0xBHh7gymbKqLXe1U9S2GF4QfBCSIUJA5B2SuhNPsK7UBx5glT5bLgkxVxqjmZLwNGC684fXg3znS8vROI55G37t1uO8MQpOIhVDAxvLN2AsxJQQc4XOVa1oOwACUTIv2rR2T_WqdBbBVOjMam9d0-XDBk1WLAb3aAOp-iBcIDmMfiqw0s7D3OSoXXeyiuMpqM0xN407d06d2M5gFURVblPLZmpQxQ9pRmnq6mCPO0RuwOeWCtchLFFZIZuwWQ2vI50vypqHyTV8A7tMIx18n083bDQLbZhjxVVop03xP23-okrZ3Pa2N0lih3fRt7DSxxPA7oBoFk49eHVsqf6U-dqm5S6fRLu1w8IHkB_2tvCSz9qvveE1PqnhF7ihBSprD5r2_MdjiwiRLG41gM7sX0Pr3R8sUhQ1x5Ilf636FXzEBt_7E_fd8wqXjvWWI2zp77K4hvCv2kRS9XJzdYXzNJZBb8AgwIvC08xv3f5zLdgM90hGEPmGcIJJeOnDyBmrLPGAymeCb37QzUYRAyd8Yvizp1--BkyYWJ34VFNRgA62gIofSXLh0SHGbdZh3uU3G9vdvPQm3GJLkwDoPFWCAvwPrOKR_EuM74KBaZhTiVT4hClo1-mR338VGHRJgJUNSgg0xl7hgbQ8tPZeFQJHdanEljR-f3t3wE82hb_5aot1qi0x6hgMh1UZX2IjM4FqgDcxJOsHs3NE50tgLc2UMFRy-w-Xv0vjRBLcgjF4YHMwnHbTlFxXPO6TdEsYpQz9BqFLarlC3&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc1OTIyMDAwOlNQVToxNzc1OTMwNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjQ4OlNQVToxNzc1OTMzNzAwOkRCVjoxNzc1OTM1ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc3Mjk5NjAwOlpBRzoxNzc3MzAyOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc3MzA1MDAwOkxIUjoxNzc3MzEzNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNiJ9",
      "price": 716,
      "from": "London",
      "to": "Split",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-04-11T16:40:00",
      "inboundDate": "2026-04-27T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HkkrAP1jGcNSQ6Po_J-WIddrlQnpR7dMtRn5-gdjhUQnPcSgS_bqX5wyQgp9XitVTlWWIOK1snu1tFMlE3HRgx9vKLtFIGgXHpbPLghskI2mk9SRawGfBraBa5Q-PWouiwsFeU0KapehM_Dy9lMw2SHF-L0RS40-Ug0L9xYMRddhNUq3QUl44tQn_IL8elLzZvkuTL-9CjFWOzQo___5YxbxnklvPz_BkmI_o2qzAWG0h32Ksf9m3Acjbss7wnJ2qwss9S9WMAL3on6y6hAdi5Q5nhv4LxjPNJH7-RpIG0sPZXU6qtBrT9AniZJr2ndEuhqhcWe9XH9_w-7IPcv5KljZtxqZS3fkeWR5e0HtRf8Asftdc-gkDxqj3wnCFnMSTrGwAZtZ3sagksN8n_7wM1VRaG_smts7SW69EIF3bwXQeNPOlrpaDJd66ZawFyvWxvgI4Z1wEPsmYwxf9i-aNa0J9y87RG0LNVl1yQS030cnI5ruCo8eDPpfC2T8Z9CDi9aUdMIrKU_kddVWE1p61MdhCxrgzV8q0KztXFNARCxV7jaQFNnRPNPG0jC2a6XZA4mM_qw1QgOoimSqWZuSTd9oePm1h5UmS97xwPMilAScG9bmiKAcQe134JsAoutLPh5XCPRYs5UXn6u-k61EQf1PU2yvyOzM84bX3IdptA6Oh_7wTRgUn0h072CxB0mvLpjag9tZneWdQ7A1Okg_iJyARSvuxv9FdOmgz7jhI9sT2hJ6U0GmHm1CS93Xn8IYAaC-UxGIQugNptmtfZq4yf1pnBj_nAQiwSc6NdoHLJRYPOqXwEnGOXm4lw-HjtaaM7Uxw9j-N-dCj-JbxFRtiuNxNiHQRObOIXoDA_xZ72gUfeMmdih_ZZEt9mSZ5j0L8CqrXbZ4OPwXJutz6P1dYUNXsb8KlqrWG3ToVKdZqAfOSXWIZrVyDmkcDBfjCcnBOg_h9FyqhdAKh69Fkts_u8kFawkSUSW8pP7iPGgP3J2zKgi5o3YKd5aPiXgalIuvl&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzk0NDE1ODAwOlpBRzoxNzk0NDIzOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzk0NDI3MjAwOkRCVjoxNzk0NDMwNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY5OkRCVjoxNzk1MTc2MDAwOlpBRzoxNzk1MTc5OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzk1MTgyMzAwOkxIUjoxNzk1MTkwNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxMyJ9",
      "price": 713,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-11-11T16:50:00",
      "inboundDate": "2026-11-20T13:00:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HdID26r6jNMpkAPpyOIqgrbvU_eQgmybB1EmbgkLjbk-6NwuatbsxxxZwLCgs8MBTgrT_VtbN-tdsJS5eVzO66N-dF0yvVaL7qZz626ZA3fpZUOj1W2vRGaWle9GyFjjGn3-hI9jCSk-uVkr7jRjnBIv8B-6pLMBU7ECtaEnabZnZxme_H13nzbOB60_3dceQtE2-qzIE2bg508Y5DBxhy2LwiMFQx2UOJ2LcbawyIJCC7QvZhHIEc7gLfnfv8RxZrdN0tPpmYi_DtbMSINieCtlOQxMm2KtWoboeHLirAaWVGj9zSRz_NQ6mDP1I20LQj16ZiYr93jCpreKrj09MogbItE5Mbuoyz1QizLLNMELHk7Up1ze-tHC3Gx-AoSq1Jz3W_3FJkCG9OfKWXHASFHH8gHLCuMWF8DjRkxinTUdfx8b4RsUG8okUqjSfWmMlv4SbLkf7rzYrC-GWqHuKi7AcjDTGbXpjbnkOG4xm6wQUc54tFowwZsrGsUDRf4WQ5NhFjRqu2b-uzWVqHNvHOARp_bR8v33RZsMehrFBJozd4n3XX7Ys7UcJDLnATnil6RaTvHZcWyoHMq056boL9gOdWOFhBJA6XEJl_ObMB8ACAFbDlEqMPCjEQM6a2mgxD1J-reDDYUsX3uIgzyUdvT4G6mRgjEzNEh5Gqh7kuNSXbUkvF3mskbkKDKvNHdPOPF_WqgusXFSK_IiB0Mu8Bua3Iq19VKOqRBRKwlfrfNAkw3mD8-bMeCDZ9Voeycl1Y8Qdu6wN7K49ZyuE0HNwAbLJGylNLRpKNxR9eg8RpOHSBNAXUdhCCLFB9W6w3s5JxkHOgzjTiXBhs9Qzaspf9J_AbBr6HJidZiZAXSYr98ZNJhkyGGatkSfvaM8spGNdNGtYgnhPf956rEUBqYoMondQ_NvjHa-TpdbYjd4AizbU1Fx-nYuFHwqJcMIij4soGv3O2-lghImVefbLkEaeRGSp_PvQ4QpaFK27UuM7fCvqgSapOf9LbsDLM2_c2eBGVjKpQi2Kbdii6gJJmlIuEg%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzkwMTc5MjAwOlpBRzoxNzkwMTg3MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzkwMTkzOTAwOkRCVjoxNzkwMTk3MjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzkxNTU1NjAwOlpBRzoxNzkxNTU4OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzkxNTYxMDAwOkxIUjoxNzkxNTY5NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxMiJ9",
      "price": 712,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-09-23T17:00:00",
      "inboundDate": "2026-10-09T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HGpQ2J-dqu8g6iZ9qk5Oc148zU54Y2wNhSfQiN8gETdZZupMrpC9NPAFuF_jvB0kWNPVS4HmKQmKIAFNUW_h05zmFtCeRSzMU4ge8j7-mz5czt-bOmHNgo8RQ4b8ML4t8XYElVPBsTyybGJX39TDSxpR9HXruFgh7DCjpCxkug1DO_UoyJS3pAOeoaKD9w1CAYwc1L_3ZG3V_c_LeIM_yrQD4mcerr9feim1uQwebDOizjo2FuwNfpzsHOuEOLgVruOiq1PzgK_22wFGx7wmHq2fVP3RRNj8U-WneVoqzMClj1r2_fFe51gPvmHTqWrgIt8jb2c5zlwpIFJ-dQzDv-dAfOVZAIrG-mrvus6f73XF1HauxT2qtyX6Zl7Y6SVsTfgN6MIOkAbWu8A2eBWRABlCSZvU7WlO_EkjNXa6dbO8Xs5oe4V9UeA3hsxUUkDgDdi7BnY2QxtMB_Z6h7jPpaGumXuNhhkqtFJ2ssuuYmGqLMqQZhNeDzQju2YskVAleUY_SJ0Dqs4qWb054U5qhnpH333nzm98FbzVpUO9oII8JPVrDS-pegCOC0d8UPvAEbsEoO0W0QmQwB2V13ty-bTLqdVsoCbt_eaho3Hiy1yMeDjV2ducpSFARp9KJ3rIhYUvotXOAhOPu4rW3-1tnIeT8oAQ8bNFDSMfzdXnBZ9HvufTfhC1pAslnjl9M0TUiiMFKn9LPMnkWhCMCkgrWhJAK9OoZuoAckDpFNEzE4SiAJjsqCYXdJ5HSkKGE7KE7rNhGpxDgkY2zITOnUICS8b1dcPvsQLkJ_SMdnz307_qQZNJUTTnOW9AXUQLdREWeCJx0WDVztuR9vogatKgfz3PDDh1Ihn9OgI-rZ1PbLSjdyhacy0c51YrdYQz2qSSHCRc6NK6HW8fnjFiDJm684e8bt5ckncPoPs5i4dtjgMQ59wABweXcqkOyuvWJ0t29INObznCEV0w2UZlDbVTkEAPIBo9wVln8wVjBQVKfS1A%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5MjkyODAwOlpBRzoxNzc5MzAwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5MzA3NTAwOkRCVjoxNzc5MzEwODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwNjY5MjAwOlpBRzoxNzgwNjcyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwNjc0NjAwOkxIUjoxNzgwNjgzMzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-20T17:00:00",
      "inboundDate": "2026-06-05T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HF-XAX2mcN4HHAjtxj__H5tK2uyr5UuNejrtRfvZsxLLppajaZnGTlRpN9NU_8kBhXip28wWNLyWJtmO-MJhqBhSX417zEzuC-q5A50XyQy2telI9oKnqxElQCZ08zXo2GcRPyoYYsZVxKUDSywijHF0QmyL8XgXqylMiUkVpJZ4IB5MGZm_Y1jfJf5I0WFr3sD3Ctkcnnsh-G98qj5DfI0Rs3zJQlOLFC1YHNmaRUUI8VkMHL8P_8oIfRxrXrD1D6sADgpHnf0P4aWg7CNOf9cEG5-M1G-jGqBFU6G6IM4khsclOMpSFA4vI0AijckgJhXeetrGUk2wdi9ifJ8OWZhmAtrU3GIz-lJNqImYFDsuBzU_CtuOSxeS4f9ZdcOaiGY7F-PAq9jz-BNhmlgf2QToTN76ViQ3NcDVRo4vbJiRDZZnhdxfG349m3IdEpkkycfzclbd27oVFFFzpRWZLJrrVwPrxouqGuMtOq7XTm5Grr9mH2U8r5ACnjmGkiR7p7qkAhcw0XovPi6xFrdskk4QEKyIOWRJHs2I-ptfYpn75ZzEOMrkYHPviLQPbTu4hEyMjCZmBsWUm216INmha2w0UbC0tkAwGnGEPxBxDHu8p0AzkeZt9dVDsp5z8dv5Wxgpl55j5TcRsn2y5A2QH68CEBm1cKGyClyBSMKCzF-zDyzbnKyFWyfrRWrSmOPV5pxP6KPDYa63X5jhnYpE7MLohbmu-CbuLIWsIxQvMmUwkq_viIJv4Xj4VuWiPM1U0Kp5-efd1ADviufjENn1WUN8PACUnAdru6_l902r-MTT7eS7vQx0RkG44N_BPOdRDNbNhrBOjgwucRpMn7frRq_Ktd-PFCVAhR7Yh6q7xo-TY8PWn4uM4I0mIZOd2dN887y1T7p61shhlDL56G_aUjxw9jW6ekvwdF5o_BMq2kPB9t_kGLtQI2I-l_K_XZve64KLf94E81u1RhbPUH5EAw4MLmVuqV0QwCAXo8-0ZGtxUIW-jUdv1lkPHQpATzCOts22XHlSwiIQIQ3UZKadrlg%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg4OTY5NjAwOlpBRzoxNzg4OTc3NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg4OTg0MzAwOkRCVjoxNzg4OTg3NjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzkwMDAwNDAwOlpBRzoxNzkwMDAzNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzkwMDA1ODAwOkxIUjoxNzkwMDE0NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-09-09T17:00:00",
      "inboundDate": "2026-09-21T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HI809zcrX-GRMggSL_wkKGKzdqOVr2ZVEbh0GTjOIx-mH2qk1_tNiYmqzUUKEVt0HsAM8tii6NB7GkdJqybHVuMiePkNT1KOSW28rOcZsROX2wA8eT0FAe4dtF29d60aw8gCQAQYRRRrEKzj_PIOjAKX0cuTWF1kggijsABE8g6VMrXIwRQFQALlI_JogOPZipVOe7f2svFtYUj3vhzuE6i_6hb67ZxU7IeW9Pf0hUb4NBZOQSrR13BAbAzkWY2j2EIXuShin5O6C9xDXqHykLk8nj4o6Le_zYrreHrmRPMCjzjwhKZtBTMSe0LbItBmnKhtovtDtNTR-NJvxdW7H7IpVFIRmxZCa-mhnTkv5LXUN7k6Brp7_5kz3l7Z-VCBdCG4e34cr2BS92Lr7QbOG0iTlryP63LEwZ9Lo1Ixi1JiCBd0mBQzeYG49n2Y3F5ewSsnx8FONAnut1mPe6ZwyFFRZQK7OWwtvXYjwUsBZgyRMaNEWO6asRtxf8mp3Nf9bT1WnDxGsK2J3kuxxS8LeSxwnvd4tqIUZEXgky31s6SiLuZ6NpbpvOZWcVJL2Cs-HrMu-cPzh2PXyoVKWbVF1D6RuimN31QdV2UZenKxTfAFUbB2d8z5o1MsGl8ogalquECOCcSfu-YFvLmv44_k5jYzS_yuEGr1XHYngA4DBO94jdTZxQyjlDaqkUXtOJoublt6EcYij_l6U9EMqvxo0IGf7v_jvH-69NS61x3vDAtUZcWmqDuM4BLlYc_i5dw6olK73Mlh5Q7_p2eG-dnTQ3RH9tdOgsUWLzho-EMhE1h-hOF3af2d4WiYcdtSeK8NLG5yZsxwTSm7GPcJmm3lAvKHYF64xi2I7814Ked_vTVHxTqqgViGwyDRlP7dGgaNWHdrGV1D_7h1ku5N6AgdqDl0xGwhKr_EohdEUIHN6RmMwGsbvTDfmGzBPabUlvZjdR1OAgd-UEUaHpfy_iv3vDJypRFgVdge7Uvpz9rkkjXj6TZ4FMVSrU0_cKmgZFlgiTNnMyirUHYNy19L0qzk8Tw%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzgyMzE2ODAwOlpBRzoxNzgyMzI0OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzgyMzMxNTAwOkRCVjoxNzgyMzM0ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgzMDg4NDAwOlpBRzoxNzgzMDkxNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgzMDkzODAwOkxIUjoxNzgzMTAyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-06-24T17:00:00",
      "inboundDate": "2026-07-03T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HtyIgteKIIyZDZuLRHQoLrvTAGpd-5ClDlMkqHkiTV9_XQeZxhmb0XnXc7aVivQpCXGEDgBT89xrp3khfJphgIY6hNZpAZRX8lO5TCQ7ONH6kz6yZITidTYQij0lOID_JC2bb2ux3LDkUJnlBDGu-H0WShZ9gQneWDvnjpGrokCvAfvq-cgmeh4GrOKV_5_KAMXtlqZBAO-mtJEA2ARG6REd7-AtRdGAqdRo6LQWmq42aa3yWJyCnmsAWmaOPePinG-ICjlhbl_GQe1vwkVTnMh88QGt7AISntMH108Qq7s4kMAcAUOc7rm8rfuvPFIr6VMEYQJzcGxzLUcueun9Qp0q92-kUKM7Ix4BIWz0JJci-30P7EsEh6xHTiSbH1rfXGl-P_ny29l-3nxWp3As-eTKP4zByxunJO2YLg541z-qDVFPvTeNOzknIrkOVo95u4mEYF9XHhkh7R7jBU1QJgTYcvFwO6RSb5cUXrwU5N6nYHHLJ1OS30XHoK57U7b4AwC4sNu2kpajvdliOzv7QTonfMsg-BJtfbv6LkmN2MJKNSDtF5P9ieLPLfr-EVi9V_x6-tgx6-aOUTMACbnJWNw5OEXGTO9uo0K3AOj2MhuhX9RVGdQN9tEFeRD3hq3sycCDdPtbjgwhBVR8deNxHIt9IObMXutoPLm0a7hb8xEVxQRVUCUvNKa3wcGyEz9jKxPXSpBo6_cFUCcoieePYV9FqQeyFLiVrtIk9Ra3ZeUpDuoDPLwn3M_yspSSPaA89iO19RfFbW10-MFV_2eSXJEmgWvLz7PDBFMfSKUmXfLhjVhwL8kfoE3bErdG8UXaCKl1fP_xOGg1xXYar2Rgt-U-2V7E62Izp79lmYGLpd1WWNZRy4u2r3ussSrdFBImqBvbI20qldj5GYRdpsIQlSkjCJzVIU4vjlbTEIWPAbadjQEcP6DDR5RViy8aIy4fHoTIyytZEMiRuMOy0M4SxaOiFoi8Q84Nia0XnrePV_sClTxpMadZZyom-z3_eE-4u&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg3MTU1MjAwOlpBRzoxNzg3MTYzMzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg3MTY5OTAwOkRCVjoxNzg3MTczMjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg4NzkwODAwOlpBRzoxNzg4Nzk0MTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg4Nzk2MjAwOkxIUjoxNzg4ODA0OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-08-19T17:00:00",
      "inboundDate": "2026-09-07T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H60Ez9XnQtCW7wa0epGX-oAEPLnVxOxf9e66cNY-WRbTlzBXhn_Ts1cDEPawmoU3Qm7Np78FWNLo93x0R2YoiFRuI8ECvWXtHvWMo_YlKRmKkdDbz_1fEM3rsaRvA4SxWxIV_M_-EMQ_t7kB5UzdGDLlUbpfHUYpwbVxnhE3DW29s-dGPEGJ19HUslvaFcOBjbPTmTNxJ4HFyIBDtUPCdsiiWnvi8t-HfTzzTJHpgTmEe0jqJY0mV2SSJXKJY6Eevl8v35uhlfCMCqikafYWQJNTjPMFNkOsZYz1JvpwXWXomXAsSc5j6FjPFNoLCCo7ZgZFy6Jy2-_GhFnv0Mm_h5-BEhqD8A-YIsAvqEMZiqzTswoGv7_mBIToDGcWBA6Q5E-iP1P5HAm5xRhbFi-onlAPA7L2ZZBui2zxeiO1E5rZU7DVDLEffRYJmjzL_VE1cWiplwYdV26Unh_Iib_Lv23ifBLG9t-1D0DJhSelGBoRY3erTRzOTHYzEAgTj2UpUNwiRwECygyxmBGdci72WHeMPlzGvBT1LNxuDe8QuXTExKlWTUL6vYf3cGze30OJhhkcM8JixfH010HCE4NG_GjqbBPi9F9N7nuYDKcbYtGCitEuDUMA9qBSRJYms6vXeiB-_wNP3qY_7FpIUkLnbIN4cq16UniUKzsEA3rIxFjx4Db8XbIiEa1w5N9jeGGCieHaV0T4yuaLFNGD2ulQXb-ypPkSyW_pUJs_AfYM5xeboaKT1zjzYX4wuWvzcCBRHLk10TXVNjvtCkF2vLkh2IG1ZJMMYtcXuXFRy2ezg75lJLYZo2XY--SufwMw1sDFaYxcAlRDnu3iZSZB6NO8eNY9Bd5QPFjAHLy3ZRZPrWZVmSIOSROtGZWZuguBOLL13CC6sxyx71GzcfXQ9rxzZe_znoc8hOodngPROkUewMxSX-iDr6z8XqgtLySr9gdJWqcpNHwGyP7Iuz_HliSY0mwMXWojA25ELA_I_6BMm2MqK_lFltIaF0_MGQKJfuJRgxj_zThJCtt8pqCGtypKFTa2cnJ2gKDqUXHV7ZeLpltU%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5MjkyODAwOlpBRzoxNzc5MzAwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5MzA3NTAwOkRCVjoxNzc5MzEwODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc5NzE4ODAwOlpBRzoxNzc5NzIyMTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc5NzI0MjAwOkxIUjoxNzc5NzMyOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-20T17:00:00",
      "inboundDate": "2026-05-25T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HxWGy0GswTttAWvxNpBaCgHy5iepiORMoNCJXiu7IWKDav4awv7gtrUx1rnQjXqwVGt5ydR9go95u8LAwe_qp5xy_idzjqQ-CzSePbMCsPBbRDaC5up2yedsOBk4-6XBxEhhQz8Rtl6KbMnYobB2uuF2JwNyH8loBOxPrUjxgMaqGC9XyMd1At7HqkdX5Yx4EFxu09yEzpqH9jL4aQFyZoMfdrbZ-FqTLAwr154FhYClkIHbl15ApUgQ2ssQejNXSXXvGi1GfVvS1RGhXD7YyHLaTtOYmxtKsXolrwx__yRP0Ofpuu3PGomWedLTPdr0VDEa7Huijt8O1BSVng3ldBjpV8sLUSAfkxZJLblgH7SiSxrs34FNM-1-fSphTD5UApvMr2GwHU72MBS5l9R-_wUPOR0BvIiXg0-m9xkWj2Y2QK1XFS6KW5CAPHM592jtCkCwcXyhzwBgT2qskmEMJ2uJ5gxaiAjrslrl7ukZTsakZXUZA03uNyMVQ-qbODrlKo2ayCYvcwmh6Ivrike_bplCLc6r2pvyp5dvpKeTAPStbkuxBX2JrPkcXPgoqLJmkDIsYb_tpT2DPPvGMcQ9JS4S6FJ2le1j0p5f_7H_Cdelsn6UuMrNnJ8AGe5f7PPoFKvKCoP3Ckrd-zWrrZtmX3DbP2JcUiGAdzWJOV732hVbFV36hTTcRmYlTpPIXs-XMnNcD99u-nM8V3AR5BGCz12tUjJQsYt4gBwNnddbzItSItYRjCYp1NOZtHq8VKHfMexCM5VJZirkDfR4jruyeSuD_zKy_RErkb-FQBd5fgYXL1K2l_bK3dpYa56bgQeviTPRCtDJKOj0FCAvN5p86rljbJaermwGiVQv7yb-Am3TArfnNO1fMVDXCZEOh7-dI-J6UEmk55YiAk_4Z-aG-H7pNbyu7wK3DDxpGv9S9S2LvGTsRp-ZxUi2oYoEjzAxHtacA9wTWNpSl8a3tuZVkuuKmzPL7aMFD1qK88Hj0fuVphdc-_jo9DY7nFdnfyXiU&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5MjkyODAwOlpBRzoxNzc5MzAwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5MzA3NTAwOkRCVjoxNzc5MzEwODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwMzIzNjAwOlpBRzoxNzgwMzI2OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwMzI5MDAwOkxIUjoxNzgwMzM3NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-20T17:00:00",
      "inboundDate": "2026-06-01T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HPnmMj7LIyT946yNwL5FQL4ZX3cIaw5Dz60cFdUGS1z_uw3M0Q_SSzN7gRDS7i7G_lcwHY1RHCXxIcc9-W4ky-HnqjGZzFfvykBGwF0bJL-JgSmmXsIHvb0FE5QQdlKuW8xd_KTlzgsUZe5PF2m5rsLMTc5VEfFh0EEXJD7ibnsTVvUnXpgpbUZRybHfyUWn8EwU6WwGYJKI8yJKjUdjm2uUEpq9UsaD-OHCA_ijQ7Bg7XK_CMzGI5fYqOILUqjlOf2GWzPNk1fgYuV-dXoR0wA0nmnxSr_F-F4DDHIcBghVtOckjXNNevZyW0V63HDTqK0_wiF023nJB42miMlCChJGpZLBsbLrZkSlmd3_tWq71bGv_fDOWJlqoU3fXAX15vVPpL-ZOikjZ20szlYpoh9y06eGHcYNjuSN8oXtSsBu31H61DSDzF1-Czcq5osbJv6koABHz9shojhwJBar3S7p6ePaGYaD00wnUFwYT1TTCEhtFVvDnQF761hsNICW2OtIJd6sXPuoU0u8pQIdLBleoF1Gq5JJ3tRrSp5Xjf2Z32ycl80Cu_W7bsDt3b48Xyx0h7dZsnzZ5YDhTVtULTgvDNT2AaWY_Np4k82rYy2zg0OrxHKK1qjvXSAJlKr3A4xiUNqGpjk1vY7Pgo1hzA5-H-7_EIl8XWk9D70GcnBWsVv-iqHdSXJ7MXhGJlK8ERNFjdmD8E-EciIyjVNsYFMxqKy9DK8e_OdF8pISWXy3Aww5Dr9v1fHfQU6Mu-pYKOqYHPSrfekcSWMGf53nvDHnr-wZhGSqxgaHIS2m8uY5d4VIWd2_DMYJkPPkRRsgXqbSISRJ1s1QBByPMOGT8Mm2Uo40AgcWdY5dXBIahPUPnR7-Ap04Y9yYK2OHAU9YaO2DGSchuHawdbIw3bjCW2dqdQo2wlxwgzL1fb4uICwyiDgnZFA8f30mG7RJKXFYW1B87XQnvVr2u3BfTa7ZYf5N4ZKEnFx_53gK32w09uKV4HJle2Oyr1GI9aYWqaHjH&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5MjkyODAwOlpBRzoxNzc5MzAwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5MzA3NTAwOkRCVjoxNzc5MzEwODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwOTI4NDAwOlpBRzoxNzgwOTMxNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwOTMzODAwOkxIUjoxNzgwOTQyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-20T17:00:00",
      "inboundDate": "2026-06-08T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HxLDz-WazJe2sluwW8xpWURAkbNI4Hva1dJ8fYZKMErx0rE6EJeMfld4x9EkgsHp8-nzYzD-j4MxqB0kWJu5bnbmFL8QS1F3a2ik92ddIJm_dD2h30BbOFoKtxJMbysw2v3gpxitJDpbuEnJVWfdHCx7Op8IdP6Bdc0OjIirvUjvyk1hUZ9nMW_qmbblqwS93ALQaWhehdc4ZHaoXZ6YbB9wKKFB5w52N1ODpjcJWElRRd-p3M8h7ctXjLeDGSw9yxXO6qNxx-QYDPIj9clOPFArTWASYD1Fpj8HvhKuoKmEIULN7YjaAzOTJBkVNRi_-ml_e9Ib_F4r3jJL8yvIYvlhKDGV_kQ3Joi-_WwSpQg7V5BBaMmsNvMgeu3hghiRMAIzO6W5-jG4IRhLjC1LrVe_IuVMyAoJVlQ3-7kd_zjTUfbqIsEPyRchrUpodrD_eEsVn5aJ1Mz168OJ-GqsN8N2siO21RhEGPYjmrx1MG3PnOGCacWFSFoLecYeGplO2nNAUHTb1BDKQWCEjmDfYWwN20L5Y5kp9CLTmEwSv8EL68l66vOpAvcRTDq8OQO-vKZrUh1xTJ-oyr1QOgRchGQ5bnFWX_xKnJsYTNYUyyKD5dTdXrS1dJUYlIfjpm0ym9L4e7v15lv733oOM9IHFjcvvLR1AyuFY1H6XtihEkQtWrZZX21E_gcVN7V4nWB5sKlyLx3ETC5_ucq8NowUQsShLQYXP-EYWQ_84Glx3Vlcfh3kxROAifm4tga0Zvshox99rboqrFjVBrnWnvhj2exi3mgjmR9BqzgBS53LLKVPu1gr9I1Mpig9UKrQhkEJDaYUHC9AgwXxPJlhB7IBruzJdu4zMZ9lLWYCSamOlb2qo5XIcQqvFrmeJu1xgeEHjtC9KxxBSqWQqeab08TM3SFBH_f0HMJlSHmdKx9wJSbiHpuVMezYnZq54c75KsWiQG7poDZPEGhO1Wehih1AA94GTNVU9y2RA1CWLTtSu8cXGuwSxxpginQvifS-EY487&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzgxMTA3MjAwOlpBRzoxNzgxMTE1MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzgxMTIxOTAwOkRCVjoxNzgxMTI1MjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgyNDgzNjAwOlpBRzoxNzgyNDg2OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgyNDg5MDAwOkxIUjoxNzgyNDk3NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-06-10T17:00:00",
      "inboundDate": "2026-06-26T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HqGHLgOTcuJBZenRQmxfIvE4I4ZL2Wv3_gucMwiC3NLc5mPaNL-OSu3S8jcTsPf6NkSN1tu5hFw5jOsWUmI5qPfrZ27nXLIGOghYfMXu93bacaeF3gXNcKZ9KOgdIFTZTd3_chEJ7EU5ZKT0b2LcKpOdIuDpDmHFz4trkZhkTOhEkUjJXBfH_Qdc9BxvInnmu4X_bvKJPRZG38xZclaIR5zZzVQRhhwhcD5SwcJJa8DhyaPhENrwe11m5hZmqMTTa6FKicRJ0AcxXuVtUzZtZZPB3PioDiVFEMVlN_lx1vTSUE8JoTftIcwBfDXpXHzWUyuvcleSujfYaP4Y3R-0XUCLyGQl9P_GWeGcW_WEZ9jmtnrv8Gv8eLSx7N5zRPCWnrFXRdsgvmK4k2nF6JRM5lpVRaJfFXaNmjw7vKzG0kNzcvurw_ZFqLmsnO9aiHk9RPD7EClDUt2YBM4A7M5b0r2txoSdmaDYOUiz1oBoXb2sKsnEnTN0XXZc0kXrwBZfUkpdYRo0PcMheEfEwtkemwobmga8hqhjq9uXuNDY6XB6XQrtL7s077pTaLlL66kSjAtZOmO2IiyhJdQ5T3mDuLhhj76meVvncGunAAUEZORaay5csyCUvTDnSJMmovrBD5iOlba71UJ-K2eEgZWBV-yourU_N_5LeYJHz7HOO4wEu1ppyZGJhh2MwGimA-ObRJRY6LY8-Mee8lM6ZMhkOkMuUd0F-ZOQWSPfFa37QaQ6JMkwQJJ-N9N0cb9clxuQREUUrSaEYZElvHnoS5pmqDJnAb0XcDWwNNohu21g_BzC86k9XtCyW2AjM5cbJHDQhGSBW8mntCamaTMECMqMXo7QrMBa8jcmb3HmRClEsMtIHbh-3XTA6TzbBCdQ4S3wGuoaA52x2x48RQBsSDKJh1ZNRCLVrg9XRF9yDXsiXVfB7P-IL1UXszZlMyzrdXm0k7oDwL8Baw0awz8060anDgtHRHzZOPAGnCjrrK_vlNx7W0noZuItVVsTVEXLzTgrC&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc3NDc4NDAwOlpBRzoxNzc3NDg2NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc3NDkzMTAwOkRCVjoxNzc3NDk2NDAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc5MTE0MDAwOlpBRzoxNzc5MTE3MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc5MTE5NDAwOkxIUjoxNzc5MTI4MTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-04-29T17:00:00",
      "inboundDate": "2026-05-18T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HkAAn1bS0XwM27NA4TDdenLrRRW0BgF-2tYIKFTGOylx69XuC4NOIgJI4WRYkqe_bNEZVXLgQur4tabGAKeLcLF2n-g6_CTEm7a-tC9VOcRp28R_7MbTuhfQNzI9Iemm6o8HsUcxWp3x3vWJdHPFyhUO0v2hDRjW8kdq3MON4gmPgwNiwxcIakDhjM4bXTtihluy4v7RLQOme66EDOISdEB99DPzaK7WIO2N2mtWrF3TexFsbhpjT17bo5HbYdUhYSjgLEQ_LEwHKdrTVcvQjKjiA31I6dkc8AkVTgVXSHVQKNJN_Y3ewhexE1b7y14DVjKAy4Ob9N6GthjxSmzzW-OUzXmoQErB7WftpGo2Ehi7Qx7PbVpJuoskoV1waxSKzBehRZCfX9Q8JRE4u7VEoKCVklY0wLNgrBa2T5NSg4dBhIICu4c4_L8nb7tbmaPWyXkjMifSLl3vND71E_GDVVSGlgAB4A_jJWUEzPCv14NiQX1SgL8GGPvBf0hGEb7e4ztq6xM-nnWoFjF-tSUGEe7yfCLQgAoVnS7aQp6_f_j_GopEVifZUtESBXP7mzFGHyYD8KyuJoaYosANYILKeFTIdAoslTLGiWp6cO395RH4MctqI9l6-OxAv9Vir8VKuyHo2C836hUdlLz2U7ZltEcGfKRH4RlaCZJ7CutSNpQwqoOa3RTN3SKtTa-yOmJmqNMkK33Ad82f14OR86etN7KMlJ8SWqk3fmobit3W0FTbbPmDyxbsd8d0js6jNdFCo1V3ynTalXZ_2db-Jf9Vfn4KcB8kyt4tqlwdaOlGw78GOu_eLGL8eGeVkjUfDdoxFaFJA-_JP3U4rDdrGlyxpyIyQ--ccS4yriXn3g9l00d__XQOlQnJL1vPqIwwumes4zwE7MrmpNb3lDJtGOv5Qx9A_hxB-mBugOQIKSM9GkgrXz7Pa8zqyUu8QDoz0zBEPZXPf9fFplHaoTl9e2sV8skiMg8h9LizfCQe400Y_CaAFabnouyBlWjh2vKxNdzum&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg1MzQwODAwOlpBRzoxNzg1MzQ4OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg1MzU1NTAwOkRCVjoxNzg1MzU4ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg2MzcxNjAwOlpBRzoxNzg2Mzc0OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg2Mzc3MDAwOkxIUjoxNzg2Mzg1NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-07-29T17:00:00",
      "inboundDate": "2026-08-10T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=Hk5ijqWB5VLUiTHG4F4J8s5xZRj3UkAsVQqsF090-95mWtFPYOyMpvo11LZkokk7GYrywU00FjBid1NXW8hiHdCvQaxjphe46fUKNltS4-znLr-wFoq0tLXGd9ia7TepMpLAjEVMh4gbKDkIa4dfRaqjtDeNrCU5ZJlSjUJlOXDqCF28ZbU5NWOetktaFUs4MeLtuwqHZrNkT5a16_WnJuGmz8Fb6JGB2fa4Z6qx8NJ2I_D9uNTugUV7AVf_iTAAg4ETqDv0mtfMUfqLxgA8S-4v4Rn66FK2IBefjfb0D9VKIoAAPe9ZRXu88vADb7t95CavQE7nOc4pe4hRTFU9l3VyyRRsUgdGpnaESuWTSddnT_jUjDsvny7AXZUThS6NBbV_XQ1M2GDcmh2dj98FTpcZch2raP482NEaAWABw7RefsSoxYX17x4w3Xa-WEbwszt9xAo_zV_v031LNBkfGhKejf0n2miHHHWi6NOdx5FrIspExBphs50LKvsDJCsnIiha2DuN7EVW3guL8nyUszMKOi1RNBDMfHSEB7uBxUqr_XP88uu_GtlufDekhaGMMHyOVGeA-W0qz0uFg57Wt0zQjYGOjb4-tREm_0ll4GFea96Rca1TK2J667jD4WYerRByUz-M3t6g5XWSlmYI5ROneDQ7jTv5z0yFCuABxshBbf9bZbOYyHGmvJnOzgpnmqbch1Qrz8p9D5rV34tpnFShVUeJypXqjUlslkaII3loc2TNsvprtnaomh-NG-8aLBOSeuYjJ7IF4J_YJb5GCxBUITPRdlMGUMsxq4PgxI9vf9Dqy8mZgVDD210CTEyq5JhV48Rd68ckSnrWuizwbsX5N3lrtGWC3DIyH37WDrolaPgoLs_Nv_zPELbjkaJ5gnk34HuyPZJaTzJ93k0u4rqIhUXfZgOAGsqfRMXf9t4xFKwGOaTN6Gh7BYK9H1zyN7wXy4QzUs0Nbzvi18W_qxs1jI57m--cL-ETAFtE65Ih0O5ve8tvmNo5t1bjuyTKBTR12Aiph46nUBsPtNKHk4g%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5ODk3NjAwOlpBRzoxNzc5OTA1NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5OTEyMzAwOkRCVjoxNzc5OTE1NjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwNjY5MjAwOlpBRzoxNzgwNjcyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwNjc0NjAwOkxIUjoxNzgwNjgzMzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-27T17:00:00",
      "inboundDate": "2026-06-05T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H4JJvt9CSQORtyPXA_HOL4iKh2ZNdHv1hipXIZSpoI6eZOXNUbbiSzcNybQpDUpB4V4wXoXZ9YqEF0KFobUK-IGLvuSgq7xKokeeblvOhWjWPMYbyJivMh5WpzhRCZysgV9KyHjZ2K36dYArarM6wWkpsurV7hotW7p5nC8gVL4mWT1rGgtxOFqbn_gcRrxi-2CVEpqD61CWd0PQlZNeDLwPAtPH0nDu1ZYU23w8crkWtDeLuYPBlGBMstoKPiXMJs0I6qYDQmJTxtrcBZ1xWCjY_PtaeYBCZck8nf_f9HbkDHc8utkWiOm1hXwARg_dn2_vDBIsQ4y39HBAae7A6JxITbesvGSmTN3w9fTfR3k50NbGXHYtQvYW1ZQmk7UE1tcs0ORa4-SP697APR2clRNoa-O6NP8qJPh2IxtjWWK1w4YbeuogPmm7569xobe6ACuq7-clqYBWpBD4ZBXA4MPKTZNEHe27QKpNeoW18AgUI7hH3FUXTTHSAPWlmNCt2fASf-9z5s6jSoQ4CPar8KBq8QRqq2nezLMlp1bfk-GLLx4gLBTqoVQtVHXn0VRGgmTmJrHi5VHWqci1kh2MflGA4YmH_4XZ0SyGvbyw3gSo6M-1RFyWxl9CPKqN8lylFsmw-7Q7331jetRDE0-Ob02-Dd1k-syjvcyUITPNQd4E3LhJcOo9Ut2u289n5oigB7HJW7asDPY7nagNDBj4CnjQAFW4WbJOI4E544KdeVlwcCFPLq20I4DkmDDZbLebJXC2PDHzSvorL8Y7hGyqbNA1iDrVX1lx_5AqAQ6Tdj70Do_fS3dq3XxJN3KAJBZi425tHCAswqRv_T_Fltq2KQfNOfGs2G1Q7RS-_8fbcEW2qHogU9mWpajC9VINT6wq9cTN11B8wxymZRDc0h4TDh4PkioyVueoRLJr0NryFepca6n17vSvnO_zdQIBAQ_HGUg__7shxKnFL41x6lbZ8zthQ-dR698ihk6gVCk9LxoBtOL8a-XLYJnXntqwKklLSPCcLCA1gOjWvDKzaMZzb8A%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg0MTMxMjAwOlpBRzoxNzg0MTM5MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg0MTQ1OTAwOkRCVjoxNzg0MTQ5MjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg1NzY2ODAwOlpBRzoxNzg1NzcwMTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg1NzcyMjAwOkxIUjoxNzg1NzgwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-07-15T17:00:00",
      "inboundDate": "2026-08-03T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HQWNbvFL6Kv8QTNK3RXGsTtAyJAIp_FvYJ1dhjF9JWXGDIydd2xJux7KHjiun9bHsYVahEqGxECjLlIzyrCT_0V2msrMTtor1Q9UOHykgDEN1jbZ2vXSUDiOubRSSsWPkTVi43vzcrVTeyJXbqCxQcXbAHgCptQNH0u6y-eqGG-5E8eavhmo6rw6iph9NVYn7aaolj9sAafy80-AWITyIQg1ZIecW4TtJBMUYe4tphq5ThjnTqDsMneRcrgOiCKjmLU0JxddIUu4L3NziJqnn65bObvq92ssyB6XoWto5C9A_ZeqcJvrNooLzGBPtlFe3zj38UPlDUfwwBmm1l1L7sO7YoI_F7wmifmWtZKHX4rpecNvWGn6_d8uz-NFeXC3kdmTxUMbj8lcg0W35B6EkY9MimL-6gTVO2vgXC4oTKBIZfsKFsEolEY2o-sbwJ_YOskDwY3uHpKXYP9UVtIqXvfQJ2yDe8sjncGF-9r_T8q-LziOl2TxonaEoLJgZE9d5qP2roILwYxl4QDWR_Q8vsIN1ZMNy1dkNS4FdKDtFpfARlnnTXJOUYiNVqrNnHzmDIdsGwB1qyTW6pinI7Gn5-55aAEV1B8Z_oQO6U8Vhd4aX7-X-lK4ywuVQvRaDtkd2OYyWMdEfUzsBIZm8RPhzw0AMeKWbedj2kjeVWmz5THpF82jaHwf33XSWn8gMT0VGsXJFc-TuIfLMHgnuANNHFNQJscziAlgYCW978ICBT3QCqOY46i1GwYYkBRWpg6PgQnBGGZ0m_FHL9pC9IwfPmbDrq810BK9aMQNngFMhzTlS1vhTLm0hDjTOWVzQqygV7vCTcrlLNTePlUhCpbH2MYdrwGGy1djNbQ8P8BvjNeJsfosV0UQcTQ8rAaONKcBm5XMIzI_z96tZ6QazlAyfFALUtAoKer7M7y8ejDhT-_v9pyn7Q1_fPyHnUAeD2hz1z_xQbr1Vmb4Q32RZH-QUYeBhKabsIBCiWWMYhqHPZGFbgvkjtbUbqhzbpG7XCYFZxetyqUrVipmaiFlPygmKbA%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzgwNTAyNDAwOlpBRzoxNzgwNTEwNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzgwNTE3MTAwOkRCVjoxNzgwNTIwNDAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgxNTMzMjAwOlpBRzoxNzgxNTM2NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgxNTM4NjAwOkxIUjoxNzgxNTQ3MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-06-03T17:00:00",
      "inboundDate": "2026-06-15T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=Hmx1Xkl-kNn46-80opPjnHjQsz7tr4q0ahR18CDOaMdRsJk-Sq-haMn40ivGQeCkef4TQ6kVHy9qygqoV396VkbW_iZPU6hy69mFD5sMBqDbzBjcBjlRxZ43gyg9WDT7AuUoL4v32N-d7sTBMyJ2ehgiKYy_yAFTPpQoLxi-Jh7yWzgNb4v8xjian4XsrUN5SDqNYXbX5U_WC3nWYD_f9-_yGnM_B82tCNlF9N6vyfuOGEUpe7mcnlJMT4k1fA3eTbu1bSrkhij7BzvvFbPe_AxMeuW3xilJVI3cgX_wmPSwZh2HD0eaRIKM7dHC_EOF_Q1ZBdGIyQbM9Bn-8MwDRSqbtk9JMwbBXfJw9gVjJjxIhdlJovVDvdynH1db3TtCenrP_ztZlQ30h-M7EcIN8MiZZ_SBsL0IYX2jZdu-QhfssyzwcBAh2W2Dcb5xYYALtqytJDdQfpDTuF7SXzsMhbfGcUdxuKluYlMGak7SrDQytA4qh6CT8cO_T9eWfeUI6WyDTZ0PIg6s9Ks8sNnNr3lTlBRqvLKuJM5KBTadweyMSfqZ_NFaAw0VOg9xAyp5GYEB5RfLm1lIev8BDDd269zGhENPevmVwfDwpuqCNQpxz_K1FX-uoSEhU-05XxuXBFYvKeGp6FmgnnkFG2W82neIiLZ0sOoLuwP7PAnQf-Rd2_yYd3BLqhU66Y-c5nwozBDtzB5EyjxCQhAKZR0SzjH_tcRGcrhPmawTrV0qGcWaIgKIQ1_-Q4W5RyWcF5ynrpd9SQ7A0oCFxm6ICcIPFr4itYyFQ_EJXwmkhc92fuTzOFoF4-X6Hnn-zdlgoJjtTPDmfGL4VHcexH34oi0iuSXETehv08WU-nPZII4H_2KR8lo3Od2OJmrNkXRRdsdtUReYu3nhCRoq13mI24rB5Vmb4lDGGj_zKPLP2fZQIjdiSwVhNSUWRuE_FCriKrgl0IwQjtivxy0o5wK-F7rJ6I4YvRnV5-vr0hBV2MOdJNGtz-B9C2neghpI0gK7_c-kMMENfnY0p02efQdVIMxKxFg%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc3NDc4NDAwOlpBRzoxNzc3NDg2NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc3NDkzMTAwOkRCVjoxNzc3NDk2NDAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc4NTA5MjAwOlpBRzoxNzc4NTEyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc4NTE0NjAwOkxIUjoxNzc4NTIzMzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-04-29T17:00:00",
      "inboundDate": "2026-05-11T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H2emUYUgiU-eTUiAcZzbLaB0QGVUqfllnYmdzUV9lGudFJMpfvoJvb55WQbZRR0EqJ9qHPJpSF9PvjbJW_c60aXDs8Y-3CSHvaJkK6xhnrGLR3cPCvDmlP5VUY55NzGleUQSdAesnMy-YYd_Bh9IYCWMIAnTsU_SQHpszhtPR8RBSfFZPxS2LNx-x3HGoWwTO3a7WGZKg-kZLU4tMeWeOdrM0mMQFULkvMxezkUPN7xiUEqqFxugg7yKm3N8G-CL8zGArqoGDORY6-qYlb6tee9SIKQjvRLjiE969u_QBNySCyfbcm62LsVBa8rPlWleJErv4hS-WBR2QkJQkJDr1rIl7yVU10Wogub5siSb5iyXeD3rYxguU6dYo9znKAsQvE4c6FglJzrB0pwNi7DQy6KbghWbzwK1p7wZV2Nh92aR-CHHmOOeW6ZK12iH4eSnbT7A1ckvQJ_3v_xWoEa9uVTtIbjbPmJ0crXomcg0damC8DVP23211-_XLA6Th8Y9uNgYBAs0g-CzAyWGkoMs1XqDTyAuJhr-_k8UXh94NRRQZndNkMrfWp9DUKyvbWhtJ5UzWnaENHbVT3GYyhDTYXuY0BN5KOYN2M5TL72ipTcwo6tzKSqmc7ZG1Fo3YFQs2orN3VanR6fYpkOpLE2SJAFXYO2Q-URAHRglve3d7pX0X0UH9HGZx5Y_ikxW4IFjNN16x_mmcG0FOvdhMgpWMly0toW4LlOVs1cRS65uftKH0hKtj8CH2ph4VdCo-5Mr7OfKW8tA5YaVH2QxgQYBxdE2gRUcNTYwwnHGR0gRdGYE5LOtUxsNLS654J7z93XRHKkCf9qyNCUZ0Z1WffCYDbdUzeqi7C6EfxQEV2D-ycqx4BwgyxaViLjKndTvs4lUQZNh3kQTuQaao06OKpTkzIlSe1F6IaV4i7PkAKa7muFwiNmhK6kOggB_dpvh3pAJX-io_bSbSi1t-GSrLeo5xR1rlXASev4lkJfPqXh-x42GkdCRxlvUDIKZYqm9-KMGikam7CfJJjV859sUpfXGgeg%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc5ODk3NjAwOlpBRzoxNzc5OTA1NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzc5OTEyMzAwOkRCVjoxNzc5OTE1NjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwOTI4NDAwOlpBRzoxNzgwOTMxNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwOTMzODAwOkxIUjoxNzgwOTQyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-05-27T17:00:00",
      "inboundDate": "2026-06-08T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HCbdNG9QcRPeQGMIs5qP9JvR6wrRlxQ1GN4d-00CRSKmmV7k43qLeZRC5vFQmyAFL1exf7erouNtOpU72zZTY-0SWj6cGKBVlLKzurmENPjXYJZHfKCi9lscnofHH5C9AKsbM819nOMx8OD-DnbzYezCrwDnLpqM744-d1N9wg1jFt7ZbUueCYq4T4LoF3SRe2ObPFTfpgD4jtJ71fqb-dhtDK5F-1Vb-9sDQvaihVfp-xUediW1yAVlY3moSbQlVFG4XUafkmAtUmOOfx-C7AXs8WN4wKtEOypk_c4GL-Bx6FCmYLlDNqU7HUBVlQPSkmyUdGa_6OVzeq-ga5MuwloeAgkQt6cMvPUTv5avp6Pe2QscGYMDWo7KIHtNfXC6Av1yp6Z70SqDmYvU-xYFlU-US4_lEDJEn6aFk1ptg_IpoUFiXVdZuizboQfAvP1CIu4q6iQTHanaa7Sw3bDf4HAqU5H_ULnrfNkz3AhXh71kJjY4vkcnwkZQAk3VYcedDHmRL2zJhxdEipTVn5G0BeUlx-MHgDhksGpY00XXX12gFi3qBF3izDuQSBwUivC7BxtdfaZn6uJt6NchAKq-PoGtD02Rk1qqSCi4IY9CL7Yq5c9xQ-FLl9ZwxSxnbCHBq-EZLx_ahl_fdTN6LOi9szkLJTst39CDbvFQ2wQqofGuva_cGP-PMtFNLqUL8u2X3rpCGOemgVvfSh1YE_S23VvPrRm9xo4IOlmo1aNvEzGPfVJZhFv13hQ1WNZoMQkMEGJ1OGetJfkWxcxIikmeG8DjoUdulYrJP3818onQ-cwsCiBYWR5L4W-83msA_xJKbNc1si7aRTHTcGfP1Q0ZD0bNRqOQhdfDRSGuqSzA8eIXLgz6I5-W4JOEh1bNIashMPQpieA9Owb-Vrl7Fln82yWVACUSg4TgHHME-Lavh0585SmcQ9djEU8woJd-YDyR18rNoA-dlY41KWHi3TY2Oy3hK9mPYnmMihKLiCEDZU2EsXF3V-HEbnFR7ApJhkTPJUuwTfUQxD-YvlKaoy5XP-w%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg1MzQwODAwOlpBRzoxNzg1MzQ4OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg1MzU1NTAwOkRCVjoxNzg1MzU4ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg1NzY2ODAwOlpBRzoxNzg1NzcwMTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg1NzcyMjAwOkxIUjoxNzg1NzgwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-07-29T17:00:00",
      "inboundDate": "2026-08-03T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HiZzb9Vt6kvQFoHrE8NbDa83dHO9-7jBuAifOzlwUNKsDih4NpzCPXAiGRSdJHH_0MWUyUxpw9mvpiNil0FZxlkRohXDkzaGggqf3aCHKzqQklMcVQhxvfG4YiRSj3oO_VXCRjhQjWqsy6_QWDtrtviGtmVKskuG4DKEcjimJwlXmacHa0M9jPhHEWq4wr4HR13m4nyZIpguQQ_y0btNu5CxRLc9msMMfZ-PqEkE26QOB1ZfaOHQs7XCknrmBpjmVR9Z2xR1AKXs7lNl_RC8d07S5VNENfY-FWVsVD5fIewohBnTytEBL3c7-Nc1AIAO3yLuAIg6iP3Vqw4bq1ofLl6RnwZiIAF1ErCRUAyGQD0213y--To5Ea7J64MTfAdkiJ-CqbRh2GS_nlO4fs00HzhbiWf1vx-X5L3elkw0eB2uEP4L7rE1vG0W5zud6uHyxL5XgcY67p42Bz83dX_vHHaMPfqgiB-ahnKr-j1KhjyguiVwq4WV1Gw1wCUaJZgl0ewVVq35KJQGtga0ACITvR9vwFmeLPh8tCesXutkRXuUObtr-z8OkFrzbWr5pwhWgIUZ50hP5kzK9XXZGnP8ujb2ul8e8wC8nkTf2SYK_JM_9mNZbEFx-pbCYGq6DdlMx0JqrO2fSZUq5RKkTI51uknF6v0lXBWP7aCwmy3EcCe4Jkp2hqTKT0FT505-uWpaZrp8fS9bAUXxLhoX9Zq2PcGMAkrCFzX2cMjX2tl9CbI6htanCq7HKXqODrGqRcrWCh5sbnraRZOFE2CqH9TJGrXAxXM73TVEDOOYmkrO4rW6nDKKEvZHMD_jHNVFX2iWfAFAb302QTGlUUtszAryDO4fq0O1Z0SrOtCeLF818dD98gkl1HjH_XoU3n4JPTHPQq-ITWgOoOkQWenVJtfSFxPLvF9t5BzZkDJvQZOPbJhlXrOr4cQgaI-wZ8K4COFs9LcbZK5X9G0jg-Uz8esUEr_m8LFjX11gwtb_4CZKq7DsL_HUx7XPzXIkBBvPnCY0sb10na_R6S8_wTnpqp8DtBw%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg4OTY5NjAwOlpBRzoxNzg4OTc3NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg4OTg0MzAwOkRCVjoxNzg4OTg3NjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg5Mzk1NjAwOlpBRzoxNzg5Mzk4OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg5NDAxMDAwOkxIUjoxNzg5NDA5NzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-09-09T17:00:00",
      "inboundDate": "2026-09-14T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H-rT5sB0FZhvAugEpceBkwpE3e_5lM2KaMiUXATF20tklyGs0Qu8-cLLwjMEMqBhpXM6Rp6m2e2NsbjK2tIIeashqeTuKROWr1HEHMAzMXPOszbUvOIKOdwc1QS3vfg9F-QZqb8kXWslb85kx6WF1AiWiw05ls4cExvELKqiFo4eU6GGmDvAyvQ-A6S9lcPPeaceZswBG24O48oySlpioLC8h3nrLbFWk_hH_nUy1IUCZwbtUyqNoKmcdXx-FXEN3ZUsr9B5n6meVm3YsAeGhCfoFjh2H9_dkx8cKAc88sdEbGvEdxlPhVxoxGUCdp1vLXhvHv40cH4LH8jEhSijDwGIU6QxVi1pAdHVAZdT60faaplZEuuhHJcmkTE7qOxCn4l-SXhnHDVqPZK95Lx7oxdj1LKyxUUpUXYlggNYAfMmx8hWRJptouZ1x2AfgqmAuf0j1NfIDR5m4N9DSnl7dlFykmig6X8fXSzVv3LVPtqK-W9cHSov0xVwD6kj600hcYTfgTEB_KxaUcdYJ4jxKh7K_Pu2wHdWUdNmKZaoU2nAI3EU4FtKUFsMK-75eLKPgPbtjTT6bk8x-H3vKJEn9BYP3ajYxjqWLigRSssOCTa06n1Yu6rLt1SgNZ46mE8vBADTiQMS0-yMqo44947qhyzZDeQt9PuWd269LHmI7PAdZYGStvr39jAWg_h5lZkrfkZMRvktXkUw-zldRN6QSxIzXl_kqU9Vg3Ixbim74DMIapSf3bRfo7tNAiTIGrhfowgGSNXTLIZDdnBDx4RmCeNFi0llENSDqFNqt0YDizCiUsNXbcQJk3_P6BNGwPox7o9lBn7QvLCaiGCD6dmWxbRl9MJRzWI9X931aC7q3QDmx_fe7XX6pb53W8mQK7RxmW-rA_6yjd_E2TEupXDOUDoYuSI6GzvjHJXOCMVgaMgOzrXQUIx2G2xdTtY6-4LzrxJrOBNsOAX3oPHAt8NFEhPRcYusb1IAP2TYIhiNg3kdUd4aERLEWA54MoEzHVadVgVk8558--hKvTI6WviJWBA%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzgwNTAyNDAwOlpBRzoxNzgwNTEwNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzgwNTE3MTAwOkRCVjoxNzgwNTIwNDAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgwOTI4NDAwOlpBRzoxNzgwOTMxNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgwOTMzODAwOkxIUjoxNzgwOTQyNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-06-03T17:00:00",
      "inboundDate": "2026-06-08T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=HKM44N-W9o9ZrbpcdgXj7E7wz6WShWg25wInFQgha9PG7CmnQ5rvXzRw_SrD4NwPK9-hqJkZ_th34P3jy-wdcyJxt-OelEt_0rQCL-Jq9I-jNGhWiC6oe7mtsDbJB6M-7Xo0fgXdBI1c-8Yw8ZmS-rJMC2biLL3_SFF9kcZMIraSJ4CwjJqgw7pYjTQcCNkQz6ANIfzvHiYwZLgvBn6fo4sx0OAbTwjhtbO_pgghFRZOIWqGRtiYvgba5TgAb0xfLP6JJZCuLfn9MPnFXsq7PpA4LOxc5-KlurJ4oJBukUpQnCi7E6H_IKHyInUXuQ3owOe2bk8dQqRRmgWXDo14eeGqCpQOrq6DBCdjJiG61PEUe171VSo3EnJoNRHvxqVJURKFpUWtMY0jRLIAvnNueW-auT4nXOY4j5I6x2BA1rF2WIpqbx1igIJdg6PXKxmXN3L3C1lq1knmT8VbeECADcmgCruYEm-krNeVengOGPlWewgGG3Vdd3nbbFJoKBOCQbe2X9TRrOfmqm8JeOHq87g8SGEhHJFLy0HKHzUB3E_wvc2q5oylNICF6qLkCVF4rWH8Q1WIlSp6a31GpNWA0ZN8ij5RTUv__hssce3RzXOdUEUaOZjFQJ_ZWDgWrRZme-jU68xNt6QThSZNX46mHvmvhKRl5FXUg-Gz9CBn8hcYORrCG0HPIspDq8H2irDySIuggP4ORhG9E0Mt1Bv7NARGy0D5Lok0j9SjVpPIExFbmS4tXd-W9Fb5snGVgkFjExNUG6m72IpfIFEdG5fCXBDTYaKpbaxIGBToQYxb9qJ6lgqana0baYWZZXSCgiHBxTlhskWuFnXGpq_BtYkexzEjevApA7tmiOSFepzVloYq2SpZVE6GG8-Vq3SbdZ__0U5JAIhN1JjubxV_fjbafo_TjpGf-1FHdSc9kR1PKt1jLowXMRLF34qpTUVace5_W7TzVc-eVdk-xfghQkP-dBPjRDdHkgL4XdKCBUuE4MKqF1A3aMToWcIe0Kk-FwjLoIphCLWwaQGKgYmhhuUsu4g%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzg0MTMxMjAwOlpBRzoxNzg0MTM5MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzg0MTQ1OTAwOkRCVjoxNzg0MTQ5MjAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzg0NTU3MjAwOlpBRzoxNzg0NTYwNTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzg0NTYyNjAwOkxIUjoxNzg0NTcxMzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-07-15T17:00:00",
      "inboundDate": "2026-07-20T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=H_SPiUBYmE4oj6-aA6-rLNIIWZcDLuVwbGBIRHwuiWFLa7spViw-ILpCN_iQq5T8ZO6XE-hHSEpfzrdwtORVwe4tgpNt7-Q9eUqn7Cue7s1Ydtbzg5AW1MtE5wmyyq_ePLYrMii5J6Qros6fNj8GElHkz42aBHSjANHxEmHtuOP8xL1KVgPWCNX4ZORu_iintUi__QT6K3uezZJl_Bik5c5RuJ9xeicyPqSM8zZnItc7NG7SZW5D60GfCwPm2We-9b8zll8nHhHIql-85_aR_Bjbh3Ep3ouwaRX6FZztjwjahsqBFt5_F4wKH_s4CMya5BgfqXYVC-H_s-LxaB3PKF1rxpeOrNloCE6ik2a0TlfSbQTtXy2S19YEM3EDuOOlJT_Oe96Ee6oAgg6rTxSHq03Aab7Qe6oaKfc2X5ptXaDcFosFc3A8fKc_CUD2v8GiicrIP2onKdxYaRDJxvhRZSTjfqZJwYdJZdGgWWZYIrTuRIdO6jk3moDu-tG8AUhA7rufwbP4G1q75GBkFH7A_HJqR0PrmMs6UyMxSDkMjm-4UfsgGpeKnHd4kvXEc8Yeqpd8KurDgCv9cFy5CesZBdjZ5NgJhM51NSEDWHngCK3D9hgRwAX_e6SrOmvPTGHtmkUz-J6xMK24agUaTvCKNJ3cvgYhKYjEsTM9qk-rpj3vw1p4EOH6arCnr39z6-3j7t1ECSJ5VmcUJStyBpBzlJfXPClAG2KX5mPTkYpP0l0E8ZtIpdB8tlzGxXvAlBEcMm5l4UKMSYskl4Hbq4T3q5n7llzxppJm0B09xdf0GRS3pxmlQi6jpyX7dHXnkGlRDdGd0e8GPe8qkf6N0Pxrr1SWvKDCshUukcx4Hybsqv-OfPW6McNxw0NT8AiKTgPEpOIVZiJvKDT4XzbYl1ce7SjFaPb9Ax8KRzWjHjNsV65jBdKzoup8PaHD518O_DCedVnPIo9CAGMPELBHaVBrdaWESEAXTELn7bXq7tNSdjH_Mn_hq64VybTEWwjW1KmEBecyOKs9eA5cnzw7pTeS1mQ%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzgyMzE2ODAwOlpBRzoxNzgyMzI0OTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY0OlpBRzoxNzgyMzMxNTAwOkRCVjoxNzgyMzM0ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzgzMzQ3NjAwOlpBRzoxNzgzMzUwOTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzgzMzUzMDAwOkxIUjoxNzgzMzYxNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNCJ9",
      "price": 714,
      "from": "London",
      "to": "Zagreb",
      "airline": "Croatia Airlines",
      "cabinClass": "BUSINESS",
      "durationMinutes": null,
      "readableDuration": null,
      "outboundDate": "2026-06-24T17:00:00",
      "inboundDate": "2026-07-06T16:20:00",
      "bookingUrl": "/en/booking/?direct=true&locale=en&currency=usd&passengers=1-0-0&token=Hoq26sPfoxfaJh-CTd8rI7Yf3Nkz2jxqNV7x4x4N9reiLAJ1IQ-XM1L8QSD1khc6DfvkjRJ-V3tFySbPATlnicrwyp0cdI1N5Y39QItouDazttDG2J6uXhhd9a5YnePID0K2GZ_ccNVM8N1QRWGmbJd21Wp6bOKUA8erOxOjoYH9oq2mMB77Edj1pClO-F2o7jtGvBRXhNG8qx8pTApr5A56AGUIBu6eKE-mAJMBlVMTnJ_gX-lmtAn78b12uKZJmC3iYfvbM6MCwrZiuDF94CR7vzRnFrqKSjKeVP2sRXwamBXtPXqkAS7HfhGWaZfaUvArXgb1XtRvK3vqVTD6v1pmnZ2_O80934V-x34Nz0q37gP8DAabg7vPYbaBBeTZXimfNcnrHAVBnT-6Bwms-unVYT6XgH1JZH50ZlMQZjM8VAgTpPmHy9mvW6ENRluN5TDB6h8JVDkMiu-UVG8bmSSpx7Tpy1vTX_lGz1gLPGt-MFT266lpDIdKu5EGH4cP1ICpH9DCevZ4eKzgw_CfS0iWpI3pOJzvNimYdR1XvrmpgjqMW6QUp_xNzym3wJB1lsxtQk5m4_hCWMLwLJw_Key-tyqJzv8Vwm5liSafo_TzXF0q1z_KNRooIz-TBj2E-YJBFTvylEmroV_SzADgp__dIqGur71RLofiHs0vs4aZ1TffhL0sN7LVQboXH6QUUrcepcr-iWZyZmlKV832WGbxKsyyQguCaTmLy4riq-6llsDqZP_NwaeHxBzN-L_gJ9FJ4EUrU6vUz9vuZR5Hi7ciExe5YV9iJL3wvZU4AND3bPpK-SfmgllLIRVlvhU0ylNUMWBzPLfaPiHMH_vmjDaY0iBHb44NuXV1-TaTKdKjNqi8bNVUwhEoxFbjWc6dTNmiX50EmkLgmNBfPEHzxMPKUrOSd-bai85gtqx40RNy--FpzdaSBmgYk0JzBMFaylhL17O1ITcRCq4xnkAISEETSE1EZ55rlkaDAIePK9FJsMnXQbIN0TnHg7tP8Y9YwAag2U8ciNr9DmW3R-V3Few%3D%3D&searchType=return&searchBags=1.0",
      "bagsInfo": {
        "includedCheckedBags": 1,
        "includedHandBags": 1,
        "hasNoBaggageSupported": false,
        "hasNoCheckedBaggage": false,
        "checkedBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 23
                }
              }
            ]
          }
        ],
        "handBagTiers": [
          {
            "tierPrice": {
              "amount": "0"
            },
            "bags": [
              {
                "weight": {
                  "value": 8
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "topResults": {
    "best": {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiTEg6MjQ3MTpMSFI6MTc3NTI4OTYwMDpNVUM6MTc3NTI5NjUwMDpidXNpbmVzczpGYWxzZTo6OkxIfExIOjE3MTA6TVVDOjE3NzUzMDY3MDA6REJWOjE3NzUzMTIxMDA6YnVzaW5lc3M6RmFsc2U6OjpMSHxMSDoxNzExOkRCVjoxNzc1OTE5OTAwOk1VQzoxNzc1OTI1NjAwOmJ1c2luZXNzOkZhbHNlOjo6TEh8TEg6MjQ4MjpNVUM6MTc3NTkyOTIwMDpMSFI6MTc3NTkzNjcwMDpidXNpbmVzczpGYWxzZTo6OkxIIiwicHJpY2UiOiI2ODAifQ==",
      "price": 680,
      "durationMinutes": 39300
    },
    "cheapest": {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiTEg6MjQ3MTpMSFI6MTc3NTI4OTYwMDpNVUM6MTc3NTI5NjUwMDpidXNpbmVzczpGYWxzZTo6OkxIfExIOjE3MTA6TVVDOjE3NzUzMDY3MDA6REJWOjE3NzUzMTIxMDA6YnVzaW5lc3M6RmFsc2U6OjpMSHxMSDoxNzExOkRCVjoxNzc1OTE5OTAwOk1VQzoxNzc1OTI1NjAwOmJ1c2luZXNzOkZhbHNlOjo6TEh8TEg6MjQ4MjpNVUM6MTc3NTkyOTIwMDpMSFI6MTc3NTkzNjcwMDpidXNpbmVzczpGYWxzZTo6OkxIIiwicHJpY2UiOiI2ODAifQ==",
      "price": 680,
      "durationMinutes": 39300
    },
    "fastest": {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiT1U6NDkxOkxIUjoxNzc1OTIyMDAwOlNQVToxNzc1OTMwNzAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjQ4OlNQVToxNzc1OTMzNzAwOkRCVjoxNzc1OTM1ODAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NjY1OkRCVjoxNzc3NjQ1MjAwOlpBRzoxNzc3NjQ4NTAwOmJ1c2luZXNzOkZhbHNlOjo6T1V8T1U6NDkwOlpBRzoxNzc3NjUwNjAwOkxIUjoxNzc3NjU5MzAwOmJ1c2luZXNzOkZhbHNlOjo6T1UiLCJwcmljZSI6IjcxNiJ9",
      "price": 716,
      "durationMinutes": 27900
    },
    "sourceTakeoffAsc": {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiTEg6MjQ3MTpMSFI6MTc3NTI4OTYwMDpNVUM6MTc3NTI5NjUwMDpidXNpbmVzczpGYWxzZTo6OkxIfExIOjE3MTA6TVVDOjE3NzUzMDY3MDA6REJWOjE3NzUzMTIxMDA6YnVzaW5lc3M6RmFsc2U6OjpMSHxMSDoxNzExOkRCVjoxNzc1OTE5OTAwOk1VQzoxNzc1OTI1NjAwOmJ1c2luZXNzOkZhbHNlOjo6TEh8TEg6MjQ4MjpNVUM6MTc3NTkyOTIwMDpMSFI6MTc3NTkzNjcwMDpidXNpbmVzczpGYWxzZTo6OkxIIiwicHJpY2UiOiI2ODAifQ==",
      "price": 680,
      "durationMinutes": 39300
    },
    "destinationLandingAsc": {
      "id": "ItineraryReturn:eyJwcm92aWRlcnMiOiJLSVdJLUJBU0lDOktJV0kiLCJyb3V0ZV9kYXRhIjoiTEg6MjQ3MTpMSFI6MTc3NTI4OTYwMDpNVUM6MTc3NTI5NjUwMDpidXNpbmVzczpGYWxzZTo6OkxIfExIOjE3MTA6TVVDOjE3NzUzMDY3MDA6REJWOjE3NzUzMTIxMDA6YnVzaW5lc3M6RmFsc2U6OjpMSHxMSDoxNzExOkRCVjoxNzc1OTE5OTAwOk1VQzoxNzc1OTI1NjAwOmJ1c2luZXNzOkZhbHNlOjo6TEh8TEg6MjQ4MjpNVUM6MTc3NTkyOTIwMDpMSFI6MTc3NTkzNjcwMDpidXNpbmVzczpGYWxzZTo6OkxIIiwicHJpY2UiOiI2ODAifQ==",
      "price": 680,
      "durationMinutes": 39300
    }
  }
}


app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));

// app.use(
//   "/payments/webhook",
//   express.raw({ type: "application/json" })
// );


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 3. ROUTES

app.use(router);



app.post('/rooms/:id/images', uploadRoomImages.array('images', 10), async (req, res) => {
  try {
    const roomId = req.params.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({message: "No images uploaded"});
    }

    // Վերբեռնել DB-ում
    const photoRecords = await Promise.all(files.map(file =>
      Photo.create({path: file.path, roomId})
    ));

    res.status(201).json({photos: photoRecords});
  } catch (err) {
    console.error(err);
    res.status(500).json({message: "Error uploading images"});
  }
});










function formatItinerariesResponse(apiResponse, page = 1, limit = 10) {
  const itineraries = apiResponse.itineraries || [];
  const metadata = apiResponse.metadata || [];
  const start = (page - 1) * limit;
  const paginated = itineraries.slice(start, start + limit);

  const topResultsRaw = metadata?.topResults || {};

  const results = paginated.map(itinerary => {
    const outboundSegment = itinerary.outbound?.sectorSegments?.[0]?.segment;
    const inboundSegment = itinerary.inbound?.sectorSegments?.[0]?.segment;

    const durationMinutes = itinerary.duration
      ? Math.ceil(itinerary.duration / 60)
      : null;
    const readableDuration = durationMinutes
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
      : null;

    // Format topResults for this itinerary
    const topResults = {};
    for (const key in topResultsRaw) {
      const top = topResultsRaw[key];
      if (top) {
        topResults[key] = {
          id: top.id,
          price: parseFloat(top.price?.amount || top.price || 0),
          durationMinutes: top.durationMinutes || top.duration
        };
      }
    }

    return {
      id: itinerary.id,
      shareId: itinerary.shareId || null,
      price: parseFloat(itinerary.price?.amount || 0),
      from: outboundSegment?.source?.station?.city?.name || '',
      to: outboundSegment?.destination?.station?.city?.name || '',
      airline: outboundSegment?.carrier?.name || '',
      cabinClass: outboundSegment?.cabinClass || '',
      durationMinutes,
      readableDuration,
      bookingUrl: itinerary.bookingOptions?.edges?.[0]?.node?.bookingUrl || '',
      bagsInfo: itinerary.bagsInfo || {},
      outboundDate: outboundSegment?.source?.localTime || '',
      inboundDate: inboundSegment?.source?.localTime || '',
      stopover: itinerary.stopover || {},
      lastAvailable: itinerary.lastAvailable || {},
      provider: itinerary.provider || {},
      topResults,
    };
  });

  return {
    page,
    limit: metadata.itinerariesCount,
    hasNextPage: start + limit < itineraries.length,
    hasPrevPage: page > 1,
    results,
    metadata: {
      carriers: metadata.carriers || [],
      topResults: metadata.topResults || {},
      outboundDays: metadata.outboundDays || [],
      inboundDays: metadata.inboundDays || [],
      stopoverCountries: metadata.stopoverCountries || [],
      contextuallyRecommendedFilters: metadata.contextuallyRecommendedFilters || [],
      priceAlertExists: metadata.priceAlertExists || null
    }
  };
}

app.get('/api/round-trip', async (req, res) => {
  try {
    const {
      source,
      destination,
      cabinClass,
      currency,
      locale,
      adults,
      children,
      infants,
      handbags,
      holdbags,
      sortBy,
      sortOrder,
      applyMixedClasses,
      allowReturnFromDifferentCity,
      allowChangeInboundDestination,
      allowChangeInboundSource,
      allowDifferentStationConnection,
      enableSelfTransfer,
      allowOvernightStopover,
      enableTrueHiddenCity,
      enableThrowAwayTicketing,
      outbound,
      transportTypes,
      contentProviders,
      priceStart,
      priceEnd,
      maxStops,
      outboundDepartureDateStart,
      outboundDepartureDateEnd,
      inboundDepartureDateStart,
      inboundDepartureDateEnd,
      limit = 20
    } = req.query;


    const page = parseInt(req.query.page) || 1;
    const limitNum = parseInt(limit) || 20;

    console.log(req.query, page, limitNum, 666666666)
    const response = await axios.get(
      'https://kiwi-com-cheap-flights.p.rapidapi.com/round-trip',
      {
        headers: {
          'x-rapidapi-host': 'kiwi-com-cheap-flights.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
          'Content-Type': 'application/json'
        },

        //  params:  {
        //   source: source || 'TBS',
        //   destination: destination || 'EVN',
        //   currency: currency || 'USD',
        //   locale: locale || 'en',
        //   adults: Number(adults) || 1,
        //   children: Number(children) || 0,
        //   infants: Number(infants) || 0,
        //   handbags: Number(handbags) || 1,
        //   holdbags: Number(holdbags) || 0,
        //   cabinClass: cabinClass || 'ECONOMY',
        //   sortBy: sortBy || 'QUALITY',
        //   sortOrder: sortOrder || 'ASCENDING',
        //   applyMixedClasses: (applyMixedClasses !== undefined ? applyMixedClasses : true).toString(),
        //   allowReturnFromDifferentCity: (allowReturnFromDifferentCity !== undefined ? allowReturnFromDifferentCity : true).toString(),
        //   allowChangeInboundDestination: (allowChangeInboundDestination !== undefined ? allowChangeInboundDestination : true).toString(),
        //   allowChangeInboundSource: (allowChangeInboundSource !== undefined ? allowChangeInboundSource : true).toString(),
        //   allowDifferentStationConnection: (allowDifferentStationConnection !== undefined ? allowDifferentStationConnection : true).toString(),
        //   enableSelfTransfer: (enableSelfTransfer !== undefined ? enableSelfTransfer : true).toString(),
        //   allowOvernightStopover: (allowOvernightStopover !== undefined ? allowOvernightStopover : true).toString(),
        //   enableTrueHiddenCity: (enableTrueHiddenCity !== undefined ? enableTrueHiddenCity : true).toString(),
        //   enableThrowAwayTicketing: (enableThrowAwayTicketing !== undefined ? enableThrowAwayTicketing : true).toString(),
        //   outbound: outbound || 'MONDAY,WEDNESDAY,FRIDAY',
        //   transportTypes: transportTypes || 'FLIGHT',
        //   contentProviders: contentProviders || 'FLIXBUS_DIRECTS,FRESH,KAYAK,KIWI',
        //   priceStart: priceStart !== undefined ? Number(priceStart) : 0,
        //   priceEnd: priceEnd !== undefined ? Number(priceEnd) : 500000,
        //   maxStopsCount: maxStops !== undefined ? Number(maxStops) : 0,
        //   outbound_departure_from: outboundDepartureDateStart ? `${outboundDepartureDateStart}T00:00:00` : undefined,
        //   outbound_departure_to: outboundDepartureDateEnd ? `${outboundDepartureDateEnd}T23:59:59` : undefined,
        //   inbound_departure_from: inboundDepartureDateStart ? `${inboundDepartureDateStart}T00:00:00` : undefined,
        //   inbound_departure_to: inboundDepartureDateEnd ? `${inboundDepartureDateEnd}T23:59:59` : undefined,
        //   limit: limitNum
        // }
        params: {
          source: source || 'Country:GB',
          destination: destination || 'City:dubrovnik_hr',
          currency: currency || 'USD',
          locale: locale || 'en',
          adults: adults || 1,
          children: children || 0,
          infants: infants || 0,
          handbags: handbags || 1,
          holdbags: holdbags || 0,
          cabinClass: cabinClass || 'ECONOMY',
          sortBy: sortBy || 'QUALITY',
          sortOrder: sortOrder || 'ASCENDING',
          applyMixedClasses: applyMixedClasses !== undefined ? applyMixedClasses : true,
          allowReturnFromDifferentCity: allowReturnFromDifferentCity !== undefined ? allowReturnFromDifferentCity : true,
          allowChangeInboundDestination: allowChangeInboundDestination !== undefined ? allowChangeInboundDestination : true,
          allowChangeInboundSource: allowChangeInboundSource !== undefined ? allowChangeInboundSource : true,
          allowDifferentStationConnection: allowDifferentStationConnection !== undefined ? allowDifferentStationConnection : true,
          enableSelfTransfer: enableSelfTransfer !== undefined ? enableSelfTransfer : true,
          allowOvernightStopover: allowOvernightStopover !== undefined ? allowOvernightStopover : true,
          enableTrueHiddenCity: enableTrueHiddenCity !== undefined ? enableTrueHiddenCity : true,
          enableThrowAwayTicketing: enableThrowAwayTicketing !== undefined ? enableThrowAwayTicketing : true,
          outbound: outbound || 'SUNDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,MONDAY,TUESDAY',
          transportTypes: transportTypes || 'FLIGHT',
          contentProviders: contentProviders || 'FLIXBUS_DIRECTS,FRESH,KAYAK,KIWI',
          priceStart: priceStart || undefined,
          priceEnd: priceEnd || undefined,
          maxStopsCount: maxStops || undefined,
          outbound_departure_from: outboundDepartureDateStart || undefined,
          outbound_departure_to: outboundDepartureDateEnd || undefined,
          inbound_departure_from: inboundDepartureDateStart || undefined,
          inbound_departure_to: inboundDepartureDateEnd || undefined,
          limit: 100
        }
      }
    );
    // Format response with pagination
    res.json(formatItinerariesResponse(response.data, page, limitNum));
    // res.json(response.data);
  } catch (err) {
    res.status(500).json({error: err.response?.data || err.message});
  }
});



///hyuranoc


const allImages = {
  bedroom: [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85?w=800",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=800",
    "https://images.unsplash.com/photo-1496116218414-097ea554bd2d?w=800",
    "https://images.unsplash.com/photo-1496473033699-f8a0fdf4f961?w=800",
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800",
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef5?w=800",
    "https://images.unsplash.com/photo-1505691723518-2fcf9d993ff9?w=800",
    "https://images.unsplash.com/photo-1505691723518-1c6bc4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-7aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-3aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-4aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-5aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-6aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-8aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-9aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-10aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-11aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-12aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-13aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-14aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-15aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-16aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-17aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-18aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-19aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-20aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-21aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-22aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-23aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-24aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-25aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-26aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-27aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-28aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-29aa7c4924e36?w=800",
    "https://images.unsplash.com/photo-1505691723518-30aa7c4924e36?w=800"
  ],
  bathroom: [
    "https://images.unsplash.com/photo-1584622781564-1d987ba8c2c7?w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    "https://images.unsplash.com/photo-1560448075-bb4caa6f4a9d?w=800",
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800",
    "https://images.unsplash.com/photo-1542315189-6e3fcbfe1139?w=800",
    "https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=800",
    "https://images.unsplash.com/photo-1505691723518-2fcf9d993ff9?w=800",
    // ... կարող ես ավելացնել լրացուցիչ մինչև 40+
  ],
  lobby: [
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    "https://images.unsplash.com/photo-1521783988139-893cebb08f8c?w=800",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    "https://images.unsplash.com/photo-1493809842364-bca8e80fad7c?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800",
    "https://images.unsplash.com/photo-1507512353773-7bb0ced8e3a5?w=800",
    "https://images.unsplash.com/photo-1520583457224-18d05b8a0e77?w=800",
    "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=800"
    // ... ավելացնել մինչև 40+
  ],
  view: [
    "https://images.unsplash.com/photo-1501117716987-c8e1ecb2105b?w=800",
    "https://images.unsplash.com/photo-1521783593447-5702b9bfd267?w=800",
    "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d6c?w=800",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
    "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800",
    "https://images.unsplash.com/photo-1496116218414-097ea554bd2d?w=800",
    "https://images.unsplash.com/photo-1496473033699-f8a0fdf4f961?w=800",
    "https://images.unsplash.com/photo-1507512353773-7bb0ced8e3a5?w=800"
    // ... ավելացնել մինչև 40+
  ]
};

app.get('/suggest', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({error: 'Query is required'});

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 5
      },
      headers: {
        'User-Agent': 'HotelsApp/1.0 (armine9086@gmail.com)'
      }
    });
    console.log(response)
    res.json(response.data);
  } catch (err) {
    console.error(err, 77777);
    res.status(500).json({error: 'Failed to fetch suggestions'});
  }
});

// petq amboxjn




function parseFeatures(features = []) {
  const out = {
    size: null,
    bedrooms: null,
    sleeps: null,
    beds: null,
    amenities: []
  };

  for (const f of features) {
    const text = f?.text;
    if (!text) continue;

    if (text.includes("sq ft")) out.size = text;
    else if (text.includes("bedroom")) out.bedrooms = +text.match(/\d+/)?.[0];
    else if (text.includes("Sleeps")) out.sleeps = +text.match(/\d+/)?.[0];
    else if (text.includes("Bed")) out.beds = text;
    else out.amenities.push(text);
  }

  return out;
}




export function mapHotelData(data) {
  return data.categorizedListings.map(unit => {
    const primary = unit.primarySelections?.[0];

    const secondary = primary?.secondarySelections || [];

    return {
      id: unit.unitId,

      name: unit.header?.text,

      images: unit?.primarySelections?.[0]?.propertyUnit?.unitGallery?.gallery
        ? unit.primarySelections[0].propertyUnit.unitGallery.gallery
          .map(i => i?.image?.url)
          .filter(Boolean)
        : [],

      features: unit.features?.map(f => f.text),

      cancellationOptions: secondary.map(sec => ({
        title: sec.secondarySelection?.description,
        price: sec.secondarySelection?.price,
        selected: sec.secondarySelection?.selected
      })),


      extras: secondary
        .flatMap(sec => sec.tertiarySelections || [])
        .map(t => ({
          id: t.optionId,
          title: t.description,
          price: t.price,
          selected: t.selected
        }))
        .filter(e => e.id),


      price: data.stickyBar?.displayPrice
    };
  });
}




function getCategory(img) {
  const text = (img.description + " " + img.accessibilityText).toLowerCase();

  if (text.includes("cama") || text.includes("bed") || text.includes("номер"))
    return "room";

  if (text.includes("bar") || text.includes("desayuno"))
    return "food";

  if (text.includes("exterior") || text.includes("fachada"))
    return "outside";

  if (text.includes("jardín") || text.includes("terraza"))
    return "outdoor";

  if (text.includes("fitness", "masajes"))
    return "gym";

  if (text.includes("sauna"))
    return "spa";

  if (text.includes("niños"))
    return "kids";

  if (text.includes("toallas") || text.includes("baño"))
    return "bathroom";

  return "other";
}




app.get("/reviews/:hotelId", async (req, res) => {
  const {hotelId} = req.params;
  const page = req.query.page || 1;

  try {
    const response = await axios.get(
      `https://hotels-com-provider.p.rapidapi.com/v2/hotels/reviews/list`,
      {
        params: {
          domain: "AR",
          locale: "es_AR",
          page_number: 1,
          sort_order: "NEWEST_TO_OLDEST",
          hotel_id: hotelId,
        },
        headers: {
          "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // map only necessary fields
    const reviews = response.data.reviewInfo.reviews.map(r => ({
      id: r.id,
      text: r.text,
      title: r.title,
      rating: r.reviewScoreWithDescription?.value,
      submissionTime: r.submissionTimeLocalized,
      brandType: r.brandType,
      managementResponses: r.managementResponses?.map(m => ({
        header: m.header?.text,
        response: m.response
      })) || [],
      photos: r.photos || []
    }));

    console.log(response.data, 7777)
    res.json({
      hotelId,
      totalReviews: response.data.reviewInfo.summary.totalCount.raw || 0,
      reviews
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({error: "Failed to fetch reviews"});
  }
});


app.get("/hotel-review", async (req, res) => {
  const {hotel_id} = req.query;

  if (!hotel_id) return res.status(400).json({error: "hotel_id is required"});

  try {
    const response = await axios.get(
      "https://hotels-com-provider.p.rapidapi.com/v2/hotels/reviews/summary",
      {
        params: {
          locale: "es_AR",
          hotel_id,
          domain: "AR"
        },
        headers: {
          "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY // store in .env
        }
      }
    );

    const hotelSummary = response.data.map(hotel => ({
      propertyId: hotel.propertyId,
      averageRating: hotel.averageOverallRating?.raw,
      cleanliness: hotel.cleanliness?.raw,
      hotelCondition: hotel.hotelCondition?.raw,
      roomComfort: hotel.roomComfort?.raw,
      serviceAndStaff: hotel.serviceAndStaff?.raw,
      totalReviews: hotel.totalCount?.raw,
      reviewDisclaimer: hotel.reviewDisclaimer,
      reviewLink: hotel.reviewDisclaimerUrl?.link?.uri?.value
    }));

    res.json({hotels: hotelSummary});


  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({error: "Failed to fetch hotel review"});
  }
});


app.get("/hotel-scores", async (req, res) => {
  const {hotel_id} = req.query;

  if (!hotel_id) return res.status(400).json({error: "hotel_id is required"});

  try {
    const response = await axios.get(
      "https://hotels-com-provider.p.rapidapi.com/v2/hotels/reviews/scores",
      {
        params: {
          domain: "AR",
          locale: "es_AR",
          hotel_id
        },
        headers: {
          "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY // պահել .env ֆայլում
        }
      }
    );

    const data = response.data?.[0];

    // Մաքրել միայն անհրաժեշտ ֆիլդերը
    const cleaned = {
      propertyId: hotel_id,
      overallRating: data?.overallScoreWithDescriptionA11y?.value || null,
      totalReviews: data?.propertyReviewCountDetails?.fullDescription || null,
      reviewDisclaimer: data?.reviewDisclaimer || null,
      reviewDisclaimerLink: data?.reviewDisclaimerUrl?.link?.value || null,
      details: data?.reviewSummaryDetails?.map(d => ({
        label: d.label,
        value: d.formattedRatingOutOfMaxA11y?.value,
        percentage: d.ratingPercentage
      })) || []
    };

    res.json({hotel: cleaned});


    // Վերադարձնել մաքուր JSON
    // res.json(response.data);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({error: "Failed to fetch hotel scores"});
  }
});


async function getRegionId(city) {
  const url = 'https://hotels-com-provider.p.rapidapi.com/v2/regions';
  const response = await axios.get(url, {
    params: {query: city, locale: 'en_US'},
    headers: {
      'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY
    }
  });
  const region = response.data?.data?.[0];
  return region?.regionId;
}


app.get('/hotels', async (req, res) => {
  console.log(req.query, 9999)
  const {
    page_number,
    guest_rating_min,
    locale,
    checkin_date,
    region_id,
    price_max,
    star_rating_ids,
    amenities,
    domain,
    checkout_date,
    accessibility,
    sort_order,
    meal_plan,
    lodging_type,
    price_min,
    payment_type,
    children_ages,
    adults_number,
    available_filter
  } = req.query;

  try {
    const url = 'https://hotels-com-provider.p.rapidapi.com/v2/hotels/search';

    const params = {
      page_number: page_number || 1,
      guest_rating_min: guest_rating_min || 8,
      locale: locale || 'es_AR',
      checkin_date: checkin_date || '2026-05-26',
      region_id: region_id || 1178,
      price_max: price_max || 500,
      star_rating_ids: star_rating_ids || '3,4,5',
      amenities: amenities || 'WIFI,PARKING',
      domain: domain || 'AR',
      checkout_date: checkout_date || '2026-05-27',
      accessibility: accessibility, // optional
      sort_order: sort_order || 'REVIEW',
      meal_plan: meal_plan || 'FREE_BREAKFAST',
      lodging_type: lodging_type || 'HOTEL,HOSTEL,APART_HOTEL',
      price_min: price_min || 10,
      payment_type: payment_type || 'PAY_LATER,FREE_CANCELLATION',
      children_ages: children_ages || '0', // optional default
      adults_number: adults_number || 1,
      available_filter: available_filter || 'SHOW_AVAILABLE_ONLY'
    };

    const headers = {
      'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com',
      'x-rapidapi-key': process.env.RAPIDAPI_KEY
    };

    const response = await axios.get(url, {params, headers});
    console.log(response.data, 888)
    // const hotels = response.data?.searchResults?.results || [];
    // res.json(response.data);

    // console.dir(response.data, { depth: null });

    const listings = response.data.propertySearchListings || [];

    const hotels = listings
      .filter(item => item.__typename === "LodgingCard")
      .map(h => ({
        id: h.id || h.lodging?.id || h.property?.id,
        name: h.name || h.lodging?.name || h.property?.name,
        address: h.address || h.lodging?.address,
        price: h.ratePlan?.price?.current || h.lodging?.ratePlan?.price?.current
      }))
      .filter(Boolean);

    res.json({hotels});


  } catch (err) {
    console.log(err, 9999999999999)
    console.error(err.response?.data || err.message);
    res.status(500).json({error: 'Something went wrong'});
  }
});



app.get("/regions", async (req, res) => {
  const {query} = req.query;
  if (!query) return res.status(400).json({error: "query is required"});

  try {
    const response = await axios.get(
      "https://hotels-com-provider.p.rapidapi.com/v2/regions",
      {
        params: {query, locale: "es_AR", domain: "AR"},
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "hotels-com-provider.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY
        }
      }
    );

    // console.log(response.data,8888)
    // Վերադարձնում ենք միայն գլխավոր տվյալները
    const regions = response.data.data.map(r => ({
      id: r.id,
      name: r.name,
      country: r.countryCode,
      fullName: r.fullName
    }));

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({error: "Failed to fetch regions"});
  }
});

app.get('/hotels/o', async (req, res) => {
  try {
    const {
      city,
      checkin,
      checkout,
      adults = 1,
      children,
      stars,
      priceMin,
      priceMax,
      page = 1,

    } = req.query;

    const role = "user"
    if (!city) return res.status(400).json({error: 'city is required'});

    const regionId = await getRegionId(city);
    if (!regionId) return res.status(400).json({error: 'Invalid city'});

    const url = 'https://hotels-com-provider.p.rapidapi.com/v2/hotels/search';
    const params = {
      region_id: regionId,
      checkin_date: checkin,
      checkout_date: checkout,
      adults_number: adults,
      children_ages: children,
      star_rating_ids: stars,
      price_min: priceMin,
      price_max: priceMax,
      page_number: page,
      sort_order: 'REVIEW',
      available_filter: 'SHOW_AVAILABLE_ONLY'
    };
    Object.keys(params).forEach(k => params[k] == null && delete params[k]);

    const response = await axios.get(url, {
      params,
      headers: {
        'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });
    console.log(role, 44444444)
    const results = response.data?.searchResults?.results || [];

    // 👤 User: միայն essential fields
    if (role === 'user') {
      const hotels = results.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        price: hotel.ratePlan?.price?.current,
        rating: hotel.starRating,
        address: hotel.address?.streetAddress,
        image: hotel.optimizedThumbUrls?.srpDesktop
      }));

      return res.json({
        total: results.length,
        hotels
      });
    }

    // 🛠 Admin: ամբողջ response
    if (role === 'admin') {
      return res.json(response.data);
    }

  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Server error',
      details: err.response?.data || err.message
    });
  }
});


async function getWixPhotos(url) {
  try {
    const {data: html} = await axios.get(url);
    const $ = cheerio.load(html);
    console.log($)
    const warmupScript = $("#wix-warmup-data").html();
    if (!warmupScript) return [];

    const warmupData = JSON.parse(warmupScript);
    const comps = warmupData.pages.compIdToTypeMap;

    const photos = new Set();

    for (const compId in comps) {
      if (comps[compId] === "WPhoto") {
        $(`#${compId} img`).each((i, el) => {
          const src = $(el).attr("src");
          if (src) {
            const fullUrl = src.startsWith("http") ? src : `https:${src}`;
            photos.add(fullUrl);
          }
        });
      }
    }

    return Array.from(photos);
  } catch (err) {
    console.error(err.message);
    return [];
  }
}


app.get("/api/hotel-photos", async (req, res) => {
  // const url = "https://www.vmodhotelyerevan.com/room-photos";
  const url = "https://anigrandhotelyerevan.com/all-rooms/";


  const photos = await getWixPhotos(url);
  res.json({count: photos.length, photos});
});


async function getAhotelSliderPhotos(url) {
  try {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.goto(url, {waitUntil: "networkidle2"});

    // 🔹 Նկարների լոդը սպասելու համար
    await new Promise(r => setTimeout(r, 2000)); // 2 վայրկյան

    const photos = await page.$$eval("#gallery img", imgs =>
      imgs.map(img => img.src)
    );

    await browser.close();
    console.log("Նկարների քանակը:", photos.length);
    console.log(photos);
    return photos;
  } catch (err) {
    console.error("Սխալ նկարի ստացման ժամանակ:", err);
    return [];
  }
}

// Օրինակ API
app.get("/api/gallery", async (req, res) => {
  const url = "https://anigrandhotelyerevan.com/all-rooms/";
  const photos = await getAhotelSliderPhotos(url);

  res.json({count: photos.length, images: photos});
});




app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.findAll();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// Get single hotel with rooms






app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: Room
    });
    if (!hotel) return res.status(404).json({message: 'Hotel not found'});
    res.json(hotel);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

// app.use(errorHandler);


app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// app.use((err, req, res, next) => {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.json(err);
// });

export default app;

