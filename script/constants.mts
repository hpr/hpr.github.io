export const WD = {
  P_IOC_COUNTRY_CODE: 'P984',
  P_LOCATED_IN_THE_ADMINISTRATIVE_TERRITORIAL_ENTITY: 'P131',
  P_INSTANCE_OF: 'P31',
  P_COUNTRY: 'P17',
  P_ELEVATION_ABOVE_SEA_LEVEL: 'P2044',
  Q_US_STATE: 'Q35657',
  Q_METRE: 'Q11573',
  Q_UNITED_STATES_OF_AMERICA: 'Q30',
};

export const getCalendarCompetitionResults_query = `query getCalendarCompetitionResults($competitionId: Int, $day: Int, $eventId: Int) {
  getCalendarCompetitionResults(competitionId: $competitionId, day: $day, eventId: $eventId) {
    competition {
      dateRange
      endDate
      name
      rankingCategory
      startDate
      venue
      __typename
    }
    eventTitles {
      rankingCategory
      eventTitle
      events {
        event
        eventId
        gender
        isRelay
        perResultWind
        withWind
        summary {
          competitor {
            teamMembers {
              id
              name
              iaafId
              urlSlug
              __typename
            }
            id
            name
            iaafId
            urlSlug
            birthDate
            __typename
          }
          mark
          nationality
          placeInRace
          placeInRound
          points
          raceNumber
          records
          wind
          __typename
        }
        races {
          date
          day
          race
          raceId
          raceNumber
          results {
            competitor {
              teamMembers {
                id
                name
                iaafId
                urlSlug
                __typename
              }
              id
              name
              iaafId
              urlSlug
              birthDate
              hasProfile
              __typename
            }
            mark
            nationality
            place
            points
            qualified
            records
            wind
            remark
            details {
              event
              eventId
              raceNumber
              mark
              wind
              placeInRound
              placeInRace
              points
              overallPoints
              placeInRoundByPoints
              overallPlaceByPoints
              __typename
            }
            __typename
          }
          startList {
            competitor {
              birthDate
              country
              id
              name
              urlSlug
              __typename
            }
            order
            pb
            sb
            bib
            __typename
          }
          wind
          __typename
        }
        __typename
      }
      __typename
    }
    options {
      days {
        date
        day
        __typename
      }
      events {
        gender
        id
        name
        combined
        __typename
      }
      __typename
    }
    parameters {
      competitionId
      day
      eventId
      __typename
    }
    __typename
  }
}`;
