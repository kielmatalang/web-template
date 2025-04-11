import React, { useState } from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';
import { useHistory } from 'react-router-dom';

// Contexts
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext';
import { useConfiguration } from '../../../../context/configurationContext';

// Utility
import { FormattedMessage } from '../../../../util/reactIntl';
import { createResourceLocatorString } from '../../../../util/routes';
import { isOriginInUse } from '../../../../util/search';

// Shared components
import { Form, PrimaryButton } from '../../../../components';

import FilterCategories from './FilterCategories/FilterCategories';
import FilterDateRange from './FilterDateRange/FilterDateRange';
import FilterLocation from './FilterLocation/FilterLocation';
import FilterKeyword from './FilterKeyword/FilterKeyword';

import { stringifyDateToISO8601 } from '../../../../util/dates';

import css from './SearchCTA.module.css';

const GRID_CONFIG = [
  { gridCss: css.gridCol1 },
  { gridCss: css.gridCol2 },
  { gridCss: css.gridCol3 },
  { gridCss: css.gridCol4 },
];

const getGridCount = numberOfFields => {
  const gridConfig = GRID_CONFIG[numberOfFields - 1];
  return gridConfig ? gridConfig.gridCss : GRID_CONFIG[0].gridCss;
};

const isEmpty = value => {
  if (value == null) return true;
  return value.hasOwnProperty('length') && value.length === 0;
};

export const SearchCTA = React.forwardRef((props, ref) => {
  const history = useHistory();
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();

  const { categories, dateRange, keywordSearch, locationSearch } = props.searchFields;

  const [submitDisabled, setSubmitDisabled] = useState(false);

  //  If no search fields are enabled, we return null (Console won't allow you to enable 0 search fields)
  const noSearchFields = isEmpty(
    [categories, dateRange, keywordSearch, locationSearch].filter(f => !isEmpty(f))
  );
  if (noSearchFields) {
    return null;
  }

  const formatDateValue = (dateRange, queryParamName) => {
    const hasDates = dateRange;
    const { startDate, endDate } = hasDates ? dateRange : {};
    const start = startDate ? stringifyDateToISO8601(startDate) : null;
    const end = endDate ? stringifyDateToISO8601(endDate) : null;
    const value = start && end ? `${start},${end}` : null;
    return { [queryParamName]: value };
  };

  const onSubmit = values => {
    // Convert form values to query parameters
    const queryParams = {};

    Object.entries(values).forEach(([key, value]) => {
      if (!isEmpty(value)) {
        if (key == 'dateRange') {
          const { dates } = formatDateValue(value, 'dates');
          queryParams.dates = dates;
        }
        if (key == 'location') {
          if (value.selectedPlace) {
            const {
              search,
              selectedPlace: { origin, bounds },
            } = value;
            queryParams.bounds = bounds;
            queryParams.address = search;

            if (isOriginInUse(config) && origin) {
              queryParams.origin = `${origin.lat},${origin.lng}`;
            }
          }
        } else {
          queryParams[key] = value;
        }
      }
    });

    const to = createResourceLocatorString('SearchPage', routeConfiguration, {}, queryParams);
    // Use history.push to navigate without page refresh
    history.push(to);
  };

  const categoryConfig = config.categoryConfiguration;

  // Count the number search fields that are enabled
  const fieldCount = [categories, dateRange, keywordSearch, locationSearch].filter(field => !!field)
    .length;

  // conditional; even if categories are enabled, we won't render categories if none are present. So need to do a bit of calculations here
  const fieldCountForGrid = categoryConfig.categories.length > 0 ? fieldCount : fieldCount - 1;

  // categoriesMaybe also checks if any categories are specified
  const categoriesMaybe =
    categories && categoryConfig.categories.length > 0 ? (
      <div className={css.filterField}>
        <FilterCategories categories={categoryConfig.categories} />
      </div>
    ) : null;
  const locationMaybe = locationSearch ? (
    <div className={css.filterField}>
      <FilterLocation setSubmitDisabled={setSubmitDisabled} />
    </div>
  ) : null;
  const keywordsMaybe = keywordSearch ? (
    <div className={css.filterField}><FilterKeyword /></div>
  ) : null;
  const dateRangeMaybe = dateRange ? (
    <div className={css.filterField}>
      <FilterDateRange config={config} />
    </div>
  ) : null;

  return (
    <div className={classNames(css.searchBarContainer, getGridCount(fieldCountForGrid))}>
      <FinalForm
        onSubmit={onSubmit}
        {...props}
        render={({ fieldRenderProps, handleSubmit }) => {
          return (
            <Form
              role="search"
              onSubmit={handleSubmit}
              className={classNames(css.gridContainer, getGridCount(fieldCountForGrid))}
            >
              {categoriesMaybe}
              {keywordsMaybe}
              {locationMaybe}
              {dateRangeMaybe}
              <PrimaryButton disabled={submitDisabled} className={css.submitButton} type="submit">
                <FormattedMessage id="SearchCTA.buttonLabel" />
              </PrimaryButton>

            </Form>
          );
        }}
      />
    </div>
  );
});

SearchCTA.displayName = 'SearchCTA';
