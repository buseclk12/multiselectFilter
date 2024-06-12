import {
    Autocomplete,
    TextField,
    Checkbox,
    createFilterOptions
  } from "@mui/material";
  import { data } from "./data";
  import parse from "autosuggest-highlight/parse";
  import match from "autosuggest-highlight/match";
  
  const toOptions = (category, depth = 0, parentId = null) => {
    const { id, name, childCategories = [] } = category;
    const children = childCategories.flatMap((child) =>
      toOptions(child, depth + 1, id)
    );
    const option = {
      id,
      name,
      depth,
      parentId,
      matchTerms: [name].concat(children.map((obj) => obj.name))
    };
    return [option].concat(children);
  };
  
  const optionsList = data.flatMap((category) => toOptions(category));
  
  export default () => {
    return (
      <Autocomplete
        options={optionsList}
        getOptionLabel={(option) => option.name}
        renderOption={(props, option, { selected, inputValue }) => {
          const matches = match(option.name, inputValue);
          const parts = parse(option.name, matches);
          return (
            <li {...props}>
              <Checkbox checked={selected} sx={{ ml: 2 * option.depth }} />
              <div>
                {parts.map((part, index) => (
                  <span
                    key={index}
                    style={{
                      fontWeight: part.highlight ? 700 : 400
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </li>
          );
        }}
        renderInput={(params) => <TextField {...params} />}
        filterOptions={createFilterOptions({
          // join with some arbitrary separator to prevent matches across adjacent terms
          stringify: (option) => option.matchTerms.join("//")
        })}
      />
    );
  };
  