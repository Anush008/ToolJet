import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { baseComponentProperties } from './DefaultComponent';
import { resolveReferences } from '@/_helpers/utils';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

export const Modal = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
  } = restProps;

  const renderCustomElement = (param, paramType = 'properties') => {
    return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
  };
  const conditionalAccordionItems = (component) => {
    const useDefaultButton = resolveReferences(
      component.component.definition.properties.useDefaultButton?.value ?? false
    );
    const accordionItems = [];
    const options = ['useDefaultButton'];

    let renderOptions = [];

    options.map((option) => renderOptions.push(renderCustomElement(option)));

    const conditionalOptions = [{ name: 'triggerButtonLabel', condition: useDefaultButton }];

    conditionalOptions.map(({ name, condition }) => {
      if (condition) renderOptions.push(renderCustomElement(name));
    });

    accordionItems.push({
      title: 'Options',
      children: renderOptions,
    });
    return accordionItems;
  };

  const properties = Object.keys(componentMeta.properties);
  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const filteredProperties = properties.filter(
    (property) => property !== 'useDefaultButton' && property !== 'triggerButtonLabel'
  );
  let updatedComponent = deepClone(component);
  if (component.component.definition.properties.size.value === 'fullscreen') {
    updatedComponent.component.properties.modalHeight = {
      ...updatedComponent.component.properties.modalHeight,
      isDisabled: true,
    };
  }

  const accordionItems = baseComponentProperties(
    filteredProperties,
    events,
    updatedComponent,
    componentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode
  );

  accordionItems.splice(1, 0, ...conditionalAccordionItems(updatedComponent));

  return <Accordion items={accordionItems} />;
};
